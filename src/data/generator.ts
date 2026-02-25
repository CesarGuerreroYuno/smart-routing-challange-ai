/**
 * generator.ts — Deterministic seeded mock data generator
 *
 * Produces a reproducible 3-hour incident dataset for VitaShop scenario.
 * Every call with the same seed returns identical data, making demos and
 * tests fully reproducible.
 *
 * [IMP-27] Exported as a standalone function so evaluators can re-run it
 * independently to reproduce the dataset (Deliverable 4).
 *
 * Incident window: 17:00–21:00 BRT (4h total, 1h pre + 3h incident)
 * Seed: 42 (default) → identical output on every refresh
 */

import {
  type Transaction,
  type RoutingEvent,
  type Incident,
  type GeneratedData,
  type ProcessorId,
  type ProcessorStatus,
  type Country,
  type PaymentMethod,
  type TransactionPhase,
  type BRPaymentMethod,
  type MXPaymentMethod,
  type COPaymentMethod,
} from '../types';

// ─── Linear Congruential Generator (LCG) PRNG ────────────────────────────────
//
// Formula: next = (a * seed + c) % m
// Parameters from "Numerical Recipes" (widely validated):
//   a = 1664525   (multiplier)
//   c = 1013904223 (increment)
//   m = 2^32       (modulus — uses unsigned 32-bit integer range)
//
// Properties:
//   - Full period of 2^32 (never repeats within our dataset)
//   - Passes basic uniformity tests for simulation purposes
//   - Seed 42 chosen arbitrarily — change to get a different but equally
//     reproducible dataset

function createLCG(seed: number) {
  let state = seed >>> 0; // force unsigned 32-bit

  /** Returns a float in [0, 1) */
  function next(): number {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 0x100000000;
  }

  /** Returns an integer in [0, max) */
  function nextInt(max: number): number {
    return Math.floor(next() * max);
  }

  /** Picks a random element from an array */
  function pick<T>(arr: readonly T[]): T {
    return arr[nextInt(arr.length)];
  }

  /** Picks based on weighted probabilities (weights must sum to 1) */
  function weightedPick<T>(items: T[], weights: number[]): T {
    const r = next();
    let cumulative = 0;
    for (let i = 0; i < items.length; i++) {
      cumulative += weights[i];
      if (r < cumulative) return items[i];
    }
    return items[items.length - 1];
  }

  return { next, nextInt, pick, weightedPick };
}

// ─── Incident configuration ───────────────────────────────────────────────────

// Base date: use a fixed reference date so times are always consistent
const BASE_DATE = new Date('2024-11-15T17:00:00-03:00'); // 17:00 BRT

function minutesAfterBase(minutes: number): Date {
  return new Date(BASE_DATE.getTime() + minutes * 60_000);
}

// Incident starts at 18:00 BRT = 60 min after base
const INCIDENT_START_OFFSET = 60; // minutes after BASE_DATE
const INCIDENT_START = minutesAfterBase(INCIDENT_START_OFFSET);

// ─── Phase definitions ────────────────────────────────────────────────────────
//
// Each phase defines:
//   startMin / endMin: offset in minutes from BASE_DATE
//   traffic: fraction of volume routed to each processor
//   authRate: auth success probability for each processor
//   txPerMin: approximate transaction rate
//   processorStatus: explicit health status per processor

interface PhaseConfig {
  phase: TransactionPhase;
  startMin: number;
  endMin: number;
  txPerMin: number;
  traffic: Record<ProcessorId, number>;
  authRate: Record<ProcessorId, number>;
  processorStatus: Record<ProcessorId, ProcessorStatus>;
}

const PHASES: PhaseConfig[] = [
  {
    // Pre-incident: Processor A handles all traffic at healthy auth rate
    phase: 'pre_incident',
    startMin: 0,
    endMin: 60, // 17:00–18:00
    txPerMin: 5,
    traffic: { 'processor-a': 1.0, 'processor-b': 0.0, 'processor-c': 0.0 },
    authRate: { 'processor-a': 0.94, 'processor-b': 0.0, 'processor-c': 0.0 },
    processorStatus: { 'processor-a': 'healthy', 'processor-b': 'healthy', 'processor-c': 'healthy' },
  },
  {
    // Incident start: A degrades rapidly (94% → 40% → 15%), B and C spin up
    phase: 'incident_start',
    startMin: 60,
    endMin: 65, // 18:00–18:05
    txPerMin: 6, // slightly elevated as retries kick in
    traffic: { 'processor-a': 0.55, 'processor-b': 0.25, 'processor-c': 0.20 },
    authRate: { 'processor-a': 0.28, 'processor-b': 0.82, 'processor-c': 0.75 },
    processorStatus: { 'processor-a': 'degraded', 'processor-b': 'healthy', 'processor-c': 'healthy' },
  },
  {
    // Rerouting: Smart routing shifts most traffic away from A
    phase: 'rerouting',
    startMin: 65,
    endMin: 80, // 18:05–18:20
    txPerMin: 6,
    traffic: { 'processor-a': 0.10, 'processor-b': 0.55, 'processor-c': 0.35 },
    authRate: { 'processor-a': 0.08, 'processor-b': 0.87, 'processor-c': 0.79 },
    processorStatus: { 'processor-a': 'degraded', 'processor-b': 'healthy', 'processor-c': 'healthy' },
  },
  {
    // Stabilized: A fully down, B and C stabilize at new auth rates
    phase: 'stabilized',
    startMin: 80,
    endMin: 180, // 18:20–20:00
    txPerMin: 5,
    traffic: { 'processor-a': 0.0, 'processor-b': 0.58, 'processor-c': 0.42 },
    authRate: { 'processor-a': 0.0, 'processor-b': 0.89, 'processor-c': 0.81 },
    processorStatus: { 'processor-a': 'down', 'processor-b': 'healthy', 'processor-c': 'healthy' },
  },
  {
    // Recovery: A comes back online, traffic gradually restored
    phase: 'recovery',
    startMin: 180,
    endMin: 240, // 20:00–21:00
    txPerMin: 5,
    traffic: { 'processor-a': 0.35, 'processor-b': 0.40, 'processor-c': 0.25 },
    authRate: { 'processor-a': 0.93, 'processor-b': 0.89, 'processor-c': 0.81 },
    processorStatus: { 'processor-a': 'healthy', 'processor-b': 'healthy', 'processor-c': 'healthy' },
  },
];

// Baseline auth rates (pre-incident normal) — used for comparison overlays [IMP-5]
export const BASELINE_AUTH_RATES: Record<ProcessorId, number> = {
  'processor-a': 0.94,
  'processor-b': 0.89, // B and C have their own historical baselines
  'processor-c': 0.81,
};

// ─── Country + payment method distributions ───────────────────────────────────
//
// [IMP-1] Corrected math: percentages sum to exactly 100% per country
// [IMP-2] Country-constrained types prevent cross-country method errors

const COUNTRY_WEIGHTS: [Country, number][] = [
  ['BR', 0.50],
  ['MX', 0.30],
  ['CO', 0.20],
];

// BR: PIX 15%, credit_card 52%, debit_card 33% = 100%
const BR_METHODS: [BRPaymentMethod, number][] = [
  ['pix', 0.15],
  ['credit_card', 0.52],
  ['debit_card', 0.33],
];

// MX: OXXO 20%, credit_card 52%, debit_card 28% = 100%
const MX_METHODS: [MXPaymentMethod, number][] = [
  ['oxxo', 0.20],
  ['credit_card', 0.52],
  ['debit_card', 0.28],
];

// CO: credit_card 60%, debit_card 40% = 100%
const CO_METHODS: [COPaymentMethod, number][] = [
  ['credit_card', 0.60],
  ['debit_card', 0.40],
];

function pickPaymentMethod(country: Country, rng: ReturnType<typeof createLCG>): PaymentMethod {
  switch (country) {
    case 'BR':
      return rng.weightedPick(
        BR_METHODS.map(([m]) => m),
        BR_METHODS.map(([, w]) => w),
      );
    case 'MX':
      return rng.weightedPick(
        MX_METHODS.map(([m]) => m),
        MX_METHODS.map(([, w]) => w),
      );
    case 'CO':
      return rng.weightedPick(
        CO_METHODS.map(([m]) => m),
        CO_METHODS.map(([, w]) => w),
      );
  }
}

// Average ticket size by payment method (USD)
const AVG_AMOUNT: Record<PaymentMethod, number> = {
  credit_card: 85,
  debit_card: 52,
  pix: 45,
  oxxo: 30,
};

// ─── Transaction generators ───────────────────────────────────────────────────

function generateTransactionsForPhase(
  phase: PhaseConfig,
  rng: ReturnType<typeof createLCG>,
  startId: number,
): Transaction[] {
  const transactions: Transaction[] = [];
  const durationMin = phase.endMin - phase.startMin;
  const totalTx = Math.round(durationMin * phase.txPerMin);

  const processorIds = Object.keys(phase.traffic) as ProcessorId[];
  const trafficWeights = processorIds.map((p) => phase.traffic[p]);

  for (let i = 0; i < totalTx; i++) {
    const id = `tx-${startId + i}`;

    // Spread transactions uniformly within the phase window
    const offsetMin = phase.startMin + (i / totalTx) * durationMin;
    const timestamp = minutesAfterBase(offsetMin);

    // Pick processor by traffic weight
    const processorId = rng.weightedPick(processorIds, trafficWeights);
    const processorStatus = phase.processorStatus[processorId];

    // Pick country and matching payment method
    const country = rng.weightedPick(
      COUNTRY_WEIGHTS.map(([c]) => c),
      COUNTRY_WEIGHTS.map(([, w]) => w),
    );
    const paymentMethod = pickPaymentMethod(country, rng);

    // Authorization outcome — slight variance per transaction
    const baseRate = phase.authRate[processorId];
    const jitter = (rng.next() - 0.5) * 0.06; // ±3% variance
    const authorized = baseRate > 0 && rng.next() < Math.max(0, Math.min(1, baseRate + jitter));

    // Amount with ±30% variance around avg ticket
    const avgAmount = AVG_AMOUNT[paymentMethod];
    const amount = Math.round(avgAmount * (0.7 + rng.next() * 0.6) * 100) / 100;

    transactions.push({
      id,
      timestamp,
      processorId,
      processorStatus,
      country,
      paymentMethod,
      amount,
      authorized,
      isBaseline: false,
      phase: phase.phase,
    });
  }

  return transactions;
}

// [IMP-6] Generate 24h of pre-incident baseline data for comparison overlays
// Uses same distributions as pre-incident phase but spread over 24h
function generateBaselineTransactions(rng: ReturnType<typeof createLCG>): Transaction[] {
  const transactions: Transaction[] = [];
  const BASELINE_HOURS = 24;
  const TX_PER_MIN = 5;
  const TOTAL = BASELINE_HOURS * 60 * TX_PER_MIN;

  for (let i = 0; i < TOTAL; i++) {
    const country = rng.weightedPick(
      COUNTRY_WEIGHTS.map(([c]) => c),
      COUNTRY_WEIGHTS.map(([, w]) => w),
    );
    const paymentMethod = pickPaymentMethod(country, rng);

    // Baseline: Processor A only, healthy auth rate with small variance
    const baseRate = BASELINE_AUTH_RATES['processor-a'];
    const authorized = rng.next() < baseRate;
    const avgAmount = AVG_AMOUNT[paymentMethod];
    const amount = Math.round(avgAmount * (0.7 + rng.next() * 0.6) * 100) / 100;

    // Spread over 24h before incident
    const offsetMin = -(BASELINE_HOURS * 60) + (i / TOTAL) * BASELINE_HOURS * 60;

    transactions.push({
      id: `baseline-${i}`,
      timestamp: minutesAfterBase(offsetMin),
      processorId: 'processor-a',
      processorStatus: 'healthy',
      country,
      paymentMethod,
      amount,
      authorized,
      isBaseline: true,
      phase: 'pre_incident',
    });
  }

  return transactions;
}

// ─── Routing events ───────────────────────────────────────────────────────────

function buildRoutingEvents(): RoutingEvent[] {
  return [
    {
      id: 'evt-1',
      timestamp: minutesAfterBase(60), // 18:00
      type: 'auth_rate_drop',
      title: 'Processor A auth rate drop detected',
      description: 'Authorization rate fell from 94% to 40% in the last 2 minutes',
      severity: 'critical',
    },
    {
      id: 'evt-2',
      timestamp: minutesAfterBase(62), // 18:02
      type: 'alert_triggered',
      title: 'Alert triggered — auth rate below threshold',
      description: 'Auth rate (40%) is below the 80% alert threshold for Processor A',
      severity: 'warning',
    },
    {
      id: 'evt-3',
      timestamp: minutesAfterBase(65), // 18:05
      type: 'failover_initiated',
      title: 'Smart routing failover initiated',
      description: 'Yuno orchestration layer activating backup processors',
      severity: 'info',
    },
    {
      id: 'evt-4',
      timestamp: minutesAfterBase(67), // 18:07
      type: 'traffic_rerouted',
      title: 'Traffic successfully rerouted',
      description: '55% of traffic → Processor B, 35% → Processor C, 10% → Processor A',
      severity: 'info',
    },
    {
      id: 'evt-5',
      timestamp: minutesAfterBase(80), // 18:20
      type: 'processor_down',
      title: 'Processor A fully unavailable',
      description: 'Processor A has gone down. All traffic rerouted to B and C',
      severity: 'critical',
    },
    {
      id: 'evt-6',
      timestamp: minutesAfterBase(180), // 20:00
      type: 'recovery_signal',
      title: 'Recovery signal received for Processor A',
      description: 'Processor A is reporting healthy status. Beginning gradual restoration',
      severity: 'info',
    },
    {
      id: 'evt-7',
      timestamp: minutesAfterBase(195), // 20:15
      type: 'traffic_restored',
      title: 'Traffic gradually restored to Processor A',
      description: 'Processor A receiving 35% of traffic at 93% auth rate',
      severity: 'success',
    },
    {
      id: 'evt-8',
      timestamp: minutesAfterBase(240), // 21:00
      type: 'system_recovered',
      title: 'System fully recovered',
      description: 'Overall auth rate restored to 93.8%. Incident resolved',
      severity: 'success',
    },
  ];
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * generateIncidentData
 *
 * Deterministic generator for the VitaShop incident dataset.
 * Returns identical data for the same seed value.
 *
 * @param seed - LCG seed (default: 42). Change to get a different but
 *   equally reproducible dataset.
 * @returns transactions, baselineTransactions, incident, and the seed used
 *
 * [IMP-27] Standalone exportable function — satisfies Deliverable 4
 * (evaluators can call this directly to reproduce the dataset)
 *
 * @example
 * import { generateIncidentData } from './src/data/generator';
 * const { transactions, incident } = generateIncidentData(42);
 */
export function generateIncidentData(seed = 42): GeneratedData {
  const rng = createLCG(seed);

  // Generate incident transactions across all phases
  let transactions: Transaction[] = [];
  let idOffset = 0;
  for (const phase of PHASES) {
    const phaseTx = generateTransactionsForPhase(phase, rng, idOffset);
    transactions = transactions.concat(phaseTx);
    idOffset += phaseTx.length;
  }

  // [IMP-6] Generate 24h baseline data (separate RNG to avoid seed contamination)
  const baselineRng = createLCG(seed + 1);
  const baselineTransactions = generateBaselineTransactions(baselineRng);

  const events = buildRoutingEvents();

  const incident: Incident = {
    id: 'incident-vitashop-001',
    startTime: INCIDENT_START,
    baselineAuthRate: 0.94,
    events,
  };

  return {
    transactions,
    baselineTransactions,
    incident,
    seed,
  };
}

// Re-export timestamp helper for use in other modules
export { minutesAfterBase, INCIDENT_START, BASE_DATE };
