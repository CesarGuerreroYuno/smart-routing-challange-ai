/**
 * dashboard.store.ts — Zustand global state
 *
 * Architecture notes:
 *
 * [IMP-10] WHY allTransactions LIVES OUTSIDE THE STORE:
 * Zustand serializes the full store object on every state change. If
 * allTransactions (1000+ items) were inside the store, every simulation
 * tick (every 3s) would trigger serialization of the entire dataset,
 * causing significant GC pressure and potential jank. Instead, we keep
 * the transactions as a module-level constant — they never change, so
 * they don't need to be reactive. Components access them directly via
 * the exported constant, and hooks derive filtered views via useMemo.
 *
 * SIMULATION CYCLE CONTRACT:
 * 1. useSimulation hook calls advanceSimulationTime(minutes) every 3000ms
 * 2. The store increments currentSimulatedTime by (minutes * simulationSpeed)
 * 3. When currentSimulatedTime passes incident.endBound, resetSimulation() loops back
 * 4. All derived data (filtered transactions, time buckets, KPIs) is computed
 *    in hooks via useMemo — they automatically re-derive when currentSimulatedTime changes
 * 5. Components subscribe only to the store slices they need, minimizing re-renders
 */

import { create } from 'zustand';
import { generateIncidentData, INCIDENT_START, BASE_DATE } from '../data/generator';
import type { Incident, DashboardFilters, Country, PaymentMethod, Transaction } from '../types';

// ─── Module-level constants (outside store) ────────────────────────────────────
//
// [IMP-10] These never change — no need to be reactive Zustand state.
// All hooks import ALL_TRANSACTIONS directly from this module.

const generated = generateIncidentData(42);

/** All incident transactions, sorted by timestamp ascending (for binary search) */
export const ALL_TRANSACTIONS: Transaction[] = generated.transactions.sort(
  (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
);

/** 24h pre-incident baseline transactions */
export const BASELINE_TRANSACTIONS: Transaction[] = generated.baselineTransactions;

/** The generated incident (events, start time, baseline auth rate) */
export const INCIDENT_DATA: Incident = generated.incident;

// Simulation window: from BASE_DATE (17:00) to end of recovery (21:00 = 240 min)
const SIMULATION_END = new Date(BASE_DATE.getTime() + 240 * 60_000);

// ─── Default filter state ─────────────────────────────────────────────────────

const DEFAULT_FILTERS: DashboardFilters = {
  timePeriod: 'since_incident',
  countries: ['BR', 'MX', 'CO'],
  paymentMethods: ['credit_card', 'debit_card', 'pix', 'oxxo'],
};

// ─── Store interface ──────────────────────────────────────────────────────────

interface DashboardStore {
  // ── State ──────────────────────────────────────────────────────────────────
  incident: Incident;
  currentSimulatedTime: Date;
  isSimulating: boolean;
  /** [IMP-8] Speed multiplier — controls minutes-per-tick (not interval duration) */
  simulationSpeed: number;
  filters: DashboardFilters;
  /** Alert threshold (0–1). Default 0.80 = 80% */
  alertThreshold: number;
  /** [IMP-8] Stretch B: side-by-side processor comparison view */
  comparisonMode: boolean;

  // ── Actions ────────────────────────────────────────────────────────────────
  /** Merge partial filter updates */
  setFilters: (filters: Partial<DashboardFilters>) => void;
  /** Convenience: toggle a single country in/out of the active set */
  toggleCountry: (country: Country) => void;
  /** Convenience: toggle a single payment method in/out of the active set */
  togglePaymentMethod: (method: PaymentMethod) => void;
  /** Reset all filters to defaults */
  resetFilters: () => void;
  /**
   * Advance currentSimulatedTime by N minutes.
   * Called by useSimulation on each interval tick.
   * Automatically loops back to incident start when SIMULATION_END is reached.
   */
  advanceSimulationTime: (minutes: number) => void;
  /** Start / pause the simulation */
  toggleSimulation: () => void;
  /** [IMP-8] Change speed multiplier (1x / 3x / 5x) */
  setSimulationSpeed: (speed: number) => void;
  /** [IMP-8] Reset simulation clock back to BASE_DATE */
  resetSimulation: () => void;
  /** [IMP-8] Jump to a specific point in time */
  seekToTime: (time: Date) => void;
  /** Update alert threshold (0–1) */
  setAlertThreshold: (threshold: number) => void;
  /** Toggle processor comparison side-by-side mode */
  toggleComparisonMode: () => void;
}

// ─── Store implementation ─────────────────────────────────────────────────────

export const useDashboardStore = create<DashboardStore>((set) => ({
  // ── Initial state ───────────────────────────────────────────────────────────
  incident: INCIDENT_DATA,
  // Start 30 min into the incident (18:30 BRT) so charts show data immediately on load
  currentSimulatedTime: new Date(INCIDENT_START.getTime() + 30 * 60_000),
  isSimulating: true, // auto-start per spec
  simulationSpeed: 1,
  filters: DEFAULT_FILTERS,
  alertThreshold: 0.8,
  comparisonMode: false,

  // ── Actions ─────────────────────────────────────────────────────────────────
  setFilters: (partial) =>
    set((state) => ({ filters: { ...state.filters, ...partial } })),

  toggleCountry: (country) =>
    set((state) => {
      const current = state.filters.countries;
      const next = current.includes(country)
        ? current.filter((c) => c !== country)
        : [...current, country];
      // Always keep at least one country selected
      if (next.length === 0) return state;
      return { filters: { ...state.filters, countries: next } };
    }),

  togglePaymentMethod: (method) =>
    set((state) => {
      const current = state.filters.paymentMethods;
      const next = current.includes(method)
        ? current.filter((m) => m !== method)
        : [...current, method];
      if (next.length === 0) return state;
      return { filters: { ...state.filters, paymentMethods: next } };
    }),

  resetFilters: () => set({ filters: DEFAULT_FILTERS }),

  advanceSimulationTime: (minutes) =>
    set((state) => {
      const { simulationSpeed } = state;
      const next = new Date(
        state.currentSimulatedTime.getTime() + minutes * simulationSpeed * 60_000,
      );
      // Loop back to start when simulation window ends
      if (next >= SIMULATION_END) {
        return { currentSimulatedTime: BASE_DATE };
      }
      return { currentSimulatedTime: next };
    }),

  toggleSimulation: () => set((state) => ({ isSimulating: !state.isSimulating })),

  // [IMP-8] Speed setter — interval stays at 3000ms, only minutes-per-tick changes
  setSimulationSpeed: (speed) => set({ simulationSpeed: speed }),

  // [IMP-8] Reset to beginning of simulation window
  resetSimulation: () =>
    set({
      currentSimulatedTime: BASE_DATE,
      isSimulating: true,
    }),

  // [IMP-8] Seek to any point in the simulation window
  seekToTime: (time) => {
    const clamped = new Date(
      Math.min(Math.max(time.getTime(), BASE_DATE.getTime()), SIMULATION_END.getTime()),
    );
    set({ currentSimulatedTime: clamped });
  },

  setAlertThreshold: (threshold) =>
    set({ alertThreshold: Math.max(0, Math.min(1, threshold)) }),

  toggleComparisonMode: () => set((state) => ({ comparisonMode: !state.comparisonMode })),
}));

// ─── Convenience selectors ────────────────────────────────────────────────────
// Use these in components to subscribe to minimal store slices

export const selectSimulationTime = (s: DashboardStore) => s.currentSimulatedTime;
export const selectIsSimulating = (s: DashboardStore) => s.isSimulating;
export const selectSimulationSpeed = (s: DashboardStore) => s.simulationSpeed;
export const selectFilters = (s: DashboardStore) => s.filters;
export const selectAlertThreshold = (s: DashboardStore) => s.alertThreshold;
export const selectComparisonMode = (s: DashboardStore) => s.comparisonMode;
export const selectIncident = (s: DashboardStore) => s.incident;
export { INCIDENT_START };
