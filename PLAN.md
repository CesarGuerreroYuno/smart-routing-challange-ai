# Smart Routing Blackout: Live Fallback Visualizer — Implementation Plan

> Revised plan incorporating 32 improvement points identified via agent review.
> Improvement points are annotated inline as `[IMP-N]`.

---

## Tech Stack
- **Vite + React 18 + TypeScript** — `npm create vite@latest` base
- **Tailwind CSS v4** via `@tailwindcss/vite` plugin — pure Tailwind, no design system dependency
- **Recharts** for all data visualizations
- **Zustand** for global state + simulation tick
- **date-fns** for date math
- **Vitest + @testing-library/react** for unit tests
- **No backend** — deterministic seeded mock data only
- **UI language**: English

---

## Project Structure

```
smart-routing-challange-ai/
├── CHALLENGE.md
├── PLAN.md                        ← this file
├── DESIGN_DECISIONS.md            ← [IMP-26] required deliverable 3
├── README.md
├── index.html
├── package.json
├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
├── vite.config.ts                 ← [IMP-12] tailwindcss() BEFORE react()
├── vitest.config.ts
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── index.css                  ← [IMP-13] @import "tailwindcss" (v4 syntax)
    ├── constants/
    │   └── processors.ts          ← [IMP-17] shared processor color tokens
    ├── types/index.ts             ← ALL TypeScript interfaces
    ├── data/
    │   └── generator.ts           ← [IMP-27][IMP-28] exportable LCG script + docs
    ├── store/
    │   └── dashboard.store.ts     ← [IMP-8][IMP-10][IMP-30] Zustand store
    ├── hooks/
    │   ├── useSimulation.ts       ← [IMP-7][IMP-21] useRef guard, speed via amount
    │   ├── useFilteredData.ts     ← [IMP-11][IMP-22][IMP-29] useMemo + pre-index
    │   ├── useTimeBuckets.ts      ← [IMP-11] derived timeBuckets hook
    │   └── useIncidentMetrics.ts  ← [IMP-9][IMP-29] defensive NaN/zero handling
    ├── lib/
    │   └── utils.ts               ← formatCurrency, formatPercent, cn()
    ├── components/
    │   ├── layout/
    │   │   ├── DashboardHeader.tsx
    │   │   └── DashboardLayout.tsx
    │   ├── incident/
    │   │   ├── IncidentBanner.tsx  ← [IMP-20] DEMO MODE banner
    │   │   └── IncidentSummaryCard.tsx
    │   ├── filters/
    │   │   └── DashboardFilters.tsx
    │   ├── processors/
    │   │   ├── ProcessorStatusGrid.tsx
    │   │   └── ProcessorCard.tsx   ← [IMP-14] use safelisted static color classes
    │   ├── charts/
    │   │   ├── AuthRateTimeline.tsx   ← [IMP-5][IMP-15][IMP-16] baseline overlay, no anim, mock
    │   │   ├── VolumeStackedBar.tsx   ← [IMP-15][IMP-16]
    │   │   ├── RoutingTimeline.tsx    ← [IMP-19] move above fold
    │   │   ├── PaymentMethodBreakdown.tsx
    │   │   └── CountryHeatmap.tsx
    │   └── export/
    │       └── ExportButton.tsx
    ├── pages/
    │   └── IncidentDashboard.tsx
    └── test/
        ├── setup.ts
        └── mocks/
            └── recharts.tsx       ← [IMP-16] ResponsiveContainer mock for jsdom
```

---

## Step 1 — Bootstrap ✅ DONE
- Vite + React 18 + TypeScript scaffolded
- Dependencies installed: recharts, zustand, date-fns, tailwindcss v4
- Full directory structure with placeholder stubs created
- Committed and pushed

---

## Step 2 — Types + Data (CRITICAL)

### `src/types/index.ts`

```typescript
// [IMP-3] RoutingEvent.type as union, not string
type RoutingEventType =
  | 'auth_rate_drop'
  | 'alert_triggered'
  | 'failover_initiated'
  | 'traffic_rerouted'
  | 'processor_down'
  | 'recovery_signal'
  | 'traffic_restored'
  | 'system_recovered';

type ProcessorId = 'processor-a' | 'processor-b' | 'processor-c';
type ProcessorStatus = 'healthy' | 'degraded' | 'down';
type Country = 'BR' | 'MX' | 'CO';
type PaymentMethod = 'credit_card' | 'debit_card' | 'pix' | 'oxxo';
type TransactionPhase = 'pre_incident' | 'incident_start' | 'rerouting' | 'stabilized' | 'recovery';

// [IMP-2] Typed constraint: pix only in BR, oxxo only in MX
type BRPaymentMethod = 'credit_card' | 'debit_card' | 'pix';
type MXPaymentMethod = 'credit_card' | 'debit_card' | 'oxxo';
type COPaymentMethod = 'credit_card' | 'debit_card';

interface Transaction {
  id: string;
  timestamp: Date;
  processorId: ProcessorId;
  processorStatus: ProcessorStatus; // [IMP-4] status on transaction
  country: Country;
  paymentMethod: PaymentMethod;
  amount: number;       // USD
  authorized: boolean;
  isBaseline: boolean;
  phase: TransactionPhase;
}

// [IMP-5] baselineAuthRate per processor in each bucket
interface ProcessorBucketData {
  authRate: number;
  baselineAuthRate: number;   // for overlay comparison
  volume: number;
  authorized: number;
  declined: number;
  status: ProcessorStatus;    // [IMP-4]
}

interface TimeBucket {
  timestamp: Date;
  label: string;
  processors: Record<ProcessorId, ProcessorBucketData>;
  totalVolume: number;
  overallAuthRate: number;
}

// [IMP-3] RoutingEventType union
interface RoutingEvent {
  id: string;
  timestamp: Date;
  type: RoutingEventType;
  title: string;
  description: string;
  severity: 'critical' | 'warning' | 'info' | 'success';
}

interface Incident {
  id: string;
  startTime: Date;
  endTime?: Date;
  baselineAuthRate: number;
  events: RoutingEvent[];
}

interface DashboardFilters {
  timePeriod: '15min' | '1hr' | 'since_incident';
  countries: Country[];
  paymentMethods: PaymentMethod[];
}
```

### `src/data/generator.ts` — [IMP-1][IMP-6][IMP-27][IMP-28]

**Payment method distribution per country (corrected math):**
- **BR**: PIX 15%, credit_card 52%, debit_card 33% → sums to 100%
- **MX**: OXXO 20%, credit_card 52%, debit_card 28% → sums to 100%
- **CO**: credit_card 60%, debit_card 40% → sums to 100%

**Incident phases:**

| Phase | Time | Proc A | Proc B | Proc C |
|-------|------|--------|--------|--------|
| Pre-incident | 17:00–18:00 | 100% / 94% auth | 0% | 0% |
| Incident start | 18:00–18:05 | drops 94%→40%→15% | ramping | ramping |
| Rerouting | 18:05–18:20 | 10% / 8% | 55% / 87% | 35% / 79% |
| Stabilized | 18:20–20:00 | DOWN 0% | 58% / 89% | 42% / 81% |
| Recovery | 20:00–21:00 | 0%→60% / 94% | scaling down | scaling down |

**[IMP-6] Pre-incident 24h baseline data:**
- Generate 24h of pre-incident data (16:00 prev day → 17:00) as `isBaseline: true`
- Use same traffic distribution as pre-incident phase
- Used for baseline comparison overlays in charts

**[IMP-28] LCG PRNG — document seed + formula:**
```typescript
// Linear Congruential Generator seeded with fixed value
// Formula: next = (a * current + c) % m
// Values: a=1664525, c=1013904223, m=2^32 (Numerical Recipes)
// Seed: 42 → identical data on every refresh
```

**[IMP-27] Export as standalone function:**
```typescript
export function generateIncidentData(seed = 42): {
  transactions: Transaction[];
  baselineTransactions: Transaction[];
  incident: Incident;
  timeBuckets: TimeBucket[];
}
```

---

## Step 3 — Store + Hooks (CRITICAL)

### `src/store/dashboard.store.ts` — [IMP-8][IMP-10][IMP-30]

```typescript
// [IMP-10] allTransactions lives OUTSIDE the store as a module constant
// to avoid serializing 1000+ items on every re-render
export const ALL_TRANSACTIONS: Transaction[] = generateIncidentData().transactions;
export const BASELINE_TRANSACTIONS: Transaction[] = generateIncidentData().baselineTransactions;

// Zustand store holds only lightweight, reactive state:
interface DashboardStore {
  incident: Incident;
  currentSimulatedTime: Date;
  isSimulating: boolean;
  simulationSpeed: number;       // [IMP-8] 1x / 3x / 5x
  filters: DashboardFilters;
  alertThreshold: number;        // default 0.80
  comparisonMode: boolean;

  // [IMP-8] Full set of actions
  setFilters: (filters: Partial<DashboardFilters>) => void;
  resetFilters: () => void;
  advanceSimulationTime: (minutes: number) => void;
  toggleSimulation: () => void;
  setSimulationSpeed: (speed: number) => void;   // [IMP-8]
  resetSimulation: () => void;                    // [IMP-8]
  seekToTime: (time: Date) => void;              // [IMP-8]
  setAlertThreshold: (threshold: number) => void;
  toggleComparisonMode: () => void;
}
```

### `src/hooks/useSimulation.ts` — [IMP-7][IMP-21]

```typescript
// [IMP-7] useRef guard prevents double-mount in React 18 StrictMode
const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

useEffect(() => {
  if (!isSimulating) {
    clearInterval(intervalRef.current!);
    return;
  }
  // [IMP-21] speed changes the minutes-per-tick amount, NOT the interval duration
  // This avoids destroying/recreating the interval on speed change
  intervalRef.current = setInterval(() => {
    const { simulationSpeed } = useDashboardStore.getState();
    advanceSimulationTime(1 * simulationSpeed); // advance N minutes per tick
  }, 3000); // interval always 3000ms

  return () => clearInterval(intervalRef.current!);
}, [isSimulating]); // [IMP-21] no simulationSpeed in deps
```

### `src/hooks/useFilteredData.ts` — [IMP-11][IMP-22][IMP-29]

```typescript
// [IMP-11] Returns filtered transactions + derived timeBuckets via useMemo
// [IMP-22] Pre-indexed transactions sorted by timestamp for binary search
// [IMP-29] JSDoc: documents return shape, empty state behavior
```

### `src/hooks/useTimeBuckets.ts` — [IMP-11]

```typescript
// Separate hook: derives TimeBucket[] from filtered transactions
// Aggregates by 5-min buckets, computes authRate + baselineAuthRate per processor
// Returns [] (not crashes) when no transactions match filters [IMP-9]
```

### `src/hooks/useIncidentMetrics.ts` — [IMP-9][IMP-29]

```typescript
// [IMP-9] All metrics have defensive fallbacks:
// - authRate: filtered.length > 0 ? authorized/total : 0 (never NaN)
// - delta: baselineAuthRate - currentAuthRate (never undefined)
// - revenueImpact: based on declined * avgTicket (0 if no data)
// [IMP-29] JSDoc: documents each metric and empty-state behavior
```

---

## Step 4 — Layout + Header

### `src/constants/processors.ts` — [IMP-17]
```typescript
// Shared color tokens for processor A/B/C — used in cards, charts, timeline
export const PROCESSOR_COLORS: Record<ProcessorId, { line: string; bar: string; text: string }> = {
  'processor-a': { line: '#3b82f6', bar: '#3b82f6', text: 'text-blue-500' },
  'processor-b': { line: '#10b981', bar: '#10b981', text: 'text-emerald-500' },
  'processor-c': { line: '#f59e0b', bar: '#f59e0b', text: 'text-amber-500' },
};
```

### `vite.config.ts` — [IMP-12]
```typescript
// [IMP-12] tailwindcss() MUST come before react() — silent failure if reversed
plugins: [tailwindcss(), react()]
```

### `src/index.css` — [IMP-13]
```css
/* [IMP-13] Tailwind v4 uses @import, NOT @tailwind directives */
@import "tailwindcss";
```

### `IncidentBanner.tsx` — [IMP-20]
- Include a "DEMO MODE" badge (amber) clearly distinguishing simulation from real data
- Red alert strip + live incident duration

---

## Step 5 — Processor Cards

### `ProcessorCard.tsx` — [IMP-14]
```typescript
// [IMP-14] Use complete static class strings — Tailwind v4 scanner cannot detect dynamic:
// BAD:  `bg-${color}-500`
// GOOD: Use a lookup object with full class names
const STATUS_CLASSES = {
  healthy: 'border-green-500 bg-green-950 text-green-400',
  degraded: 'border-orange-500 bg-orange-950 text-orange-400',
  down: 'border-red-500 bg-red-950 text-red-400 animate-pulse',
};
```

### Alert threshold coloring (Stretch A) — [IMP-14]
```typescript
// Same pattern: full static class strings in lookup, never template literals
const ALERT_CLASSES = {
  critical: 'border-red-500 text-red-400 ring-2 ring-red-500/50',
  warning: 'border-orange-500 text-orange-400',
  normal: 'border-zinc-700 text-green-400',
};
```

---

## Step 6 — Incident Summary

### `IncidentSummaryCard.tsx` — [IMP-9][IMP-18]
- [IMP-9] All 4 KPIs have fallback values (show `—` or `0` when data is empty)
- [IMP-18] Loading/empty state: skeleton cards while simulation hasn't started yet

---

## Step 7 — Charts

### `AuthRateTimeline.tsx` — [IMP-5][IMP-15][IMP-16][IMP-19]
- [IMP-5] Render baseline reference line per processor using `baselineAuthRate` from `TimeBucket`
- [IMP-15] `isAnimationActive={false}` on all Line components — prevents re-animation on each tick
- [IMP-16] Mock `ResponsiveContainer` in test setup (jsdom reports 0×0 dimensions)

### `VolumeStackedBar.tsx` — [IMP-15][IMP-16][IMP-18]
- [IMP-15] `isAnimationActive={false}` on all Bar components
- [IMP-18] Empty state message when no data matches current filters

### `RoutingTimeline.tsx` — [IMP-19]
- [IMP-19] Place this component **above the fold** (top of IncidentDashboard, below processor cards)
- Progressive reveal as simulation advances

### All chart components — [IMP-16] test mock pattern:
```typescript
// src/test/mocks/recharts.tsx
vi.mock('recharts', async () => {
  const actual = await vi.importActual('recharts');
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div style={{ width: 800, height: 400 }}>{children}</div>
    ),
  };
});
```

---

## Step 8 — Filters

### `DashboardFilters.tsx`
- Time period: Select — "Last 15 minutes" / "Last 1 hour" / "Since incident start"
- Country: Tab group — All / BR / MX / CO
- Payment method: Toggle group — All / Credit / Debit / PIX / OXXO
- "Reset Filters" ghost button
- [IMP-18] Filters that exclude all data show empty-state in each chart (not broken charts)

---

## Step 9 — Stretch Goals + Assembly

### Stretch A — Alert Threshold — [IMP-14]
- Static class lookup (not dynamic template literals)
- Configurable threshold via header input → `setAlertThreshold` action

### Stretch B — Processor Comparison Mode
- Toggle "Compare Mode" → 2-column CSS grid
- `ComposedChart` per processor: auth rate Line + volume Bar

### Stretch C — Export Incident Report — [IMP-27]
```typescript
// Export includes: incident summary, routing events, processor performance,
// filter state, and the LCG seed used to reproduce the data
```

### Stretch D — Speed Control — [IMP-21]
- Speed buttons (1x / 3x / 5x) → `setSimulationSpeed(n)` action
- [IMP-21] Speed changes `minutes per tick`, NOT the interval duration

### `IncidentDashboard.tsx` — assembly with [IMP-19] layout order:
1. IncidentBanner (DEMO MODE + alert strip)
2. IncidentSummaryCard (4 KPIs)
3. ProcessorStatusGrid
4. **RoutingTimeline** ← [IMP-19] above fold, not at the bottom
5. DashboardFilters
6. AuthRateTimeline (primary chart)
7. VolumeStackedBar
8. PaymentMethodBreakdown + CountryHeatmap (side by side)

---

## Step 10 — Documentation + Deliverables — [IMP-26][IMP-28][IMP-29][IMP-30][IMP-31][IMP-32]

### `DESIGN_DECISIONS.md` — [IMP-26]
200-400 words covering:
- Why line charts for auth rates (trends + crossovers readable)
- Why stacked bar for volume (shift A→B+C readable)
- Why RoutingTimeline above fold (primary evidence of smart routing)
- Why `allTransactions` outside Zustand (performance)
- Why LCG PRNG (reproducibility for evaluators)
- Why speed via amount-per-tick not interval-duration (UX smoothness)

### `README.md` — [IMP-32]
- Screenshot/GIF of dashboard
- Feature checklist (core + stretch)
- How the simulation works
- How to reproduce the data (LCG seed = 42)
- Setup instructions

### Code documentation — [IMP-28][IMP-29][IMP-30][IMP-31]
- `generator.ts`: JSDoc each phase, document LCG params, seed value
- `useIncidentMetrics.ts`: JSDoc each returned metric, empty-state behavior
- `useFilteredData.ts`: JSDoc return shape, binary search approach
- `dashboard.store.ts`: Comment why transactions live outside store, simulation cycle contract
- `vite.config.ts`: Inline comment on plugin order requirement

---

## Improvement Points Reference

| # | Category | Description | Step |
|---|----------|-------------|------|
| 1 | Data | Payment method % corrected per country | Step 2 |
| 2 | Types | PaymentMethod constraint by Country | Step 2 |
| 3 | Types | RoutingEvent.type as union type | Step 2 |
| 4 | Types | ProcessorStatus on Transaction + TimeBucket | Step 2 |
| 5 | Types | baselineAuthRate in TimeBucket per processor | Step 2 |
| 6 | Data | 24h pre-incident baseline data | Step 2 |
| 7 | Hooks | useSimulation useRef guard for StrictMode | Step 3 |
| 8 | Store | Missing actions: setSimulationSpeed, resetSimulation, seekToTime | Step 3 |
| 9 | Hooks | useIncidentMetrics defensive NaN/zero handling | Step 3 |
| 10 | Store | allTransactions as module constant outside Zustand | Step 3 |
| 11 | Hooks | timeBuckets as useMemo in hook, not store | Step 3 |
| 12 | Config | tailwindcss() before react() in vite.config.ts | Step 4 |
| 13 | Config | @import "tailwindcss" syntax (not v3 directives) | Step 4 |
| 14 | Tailwind | Static class strings in lookup objects (not dynamic) | Step 5 |
| 15 | Recharts | isAnimationActive={false} on all Lines/Bars | Step 7 |
| 16 | Recharts | ResponsiveContainer mock for jsdom tests | Step 7 |
| 17 | UX | Shared processor color tokens in constants file | Step 4 |
| 18 | UX | Loading/empty/error states in all components | Steps 5–8 |
| 19 | UX | RoutingTimeline above the fold | Step 9 |
| 20 | UX | DEMO MODE banner in IncidentBanner | Step 4 |
| 21 | Performance | Speed via minutes-per-tick, not interval duration | Step 3 |
| 22 | Performance | Pre-index transactions by timestamp | Step 3 |
| 23 | Estimates | Step 2 is ~60 min, not 30 | — |
| 24 | Estimates | Step 7 is ~55 min, not 40 | — |
| 25 | Estimates | 4 stretch goals in 20 min is inviable | — |
| 26 | Deliverables | DESIGN_DECISIONS.md required | Step 10 |
| 27 | Deliverables | generator.ts as exportable standalone script | Step 2 |
| 28 | Docs | JSDoc in generator.ts | Step 10 |
| 29 | Docs | JSDoc in hooks | Step 10 |
| 30 | Docs | Comments in dashboard.store.ts | Step 10 |
| 31 | Docs | Inline comments in vite.config.ts | Step 4 |
| 32 | Docs | Full README | Step 10 |

---

## Verification Checklist
1. `npm run dev` → loads at `localhost:5173`
2. Processor cards show health status + auth rates
3. Simulation auto-starts; charts update every 3s
4. Filters update all charts simultaneously
5. RoutingTimeline events appear progressively
6. Export button downloads valid JSON with LCG seed
7. `npm run test` → all tests pass (including chart tests with mock)
8. `npm run build` → no TypeScript errors
