# Smart Routing Blackout: Live Fallback Visualizer

> Real-time payment routing dashboard for monitoring Yuno's smart routing
> during processor incidents. Built for the VitaShop war room scenario.

---

## Setup

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Features

### Core Requirements
- [x] **Real-time routing visualization** — Processor health status, live auth rates, volume distribution, routing change timeline
- [x] **Multi-dimensional breakdown** — Filter by payment method (credit/debit/PIX/OXXO), country (BR/MX/CO), and time period
- [x] **Incident summary** — Duration counter, auth rate vs baseline, total volume, estimated revenue impact

### Stretch Goals
- [x] **A — Alert thresholds** — Color-coded processor cards (red/orange/green) based on configurable auth rate thresholds
- [x] **B — Processor comparison mode** — Side-by-side processor performance view
- [x] **C — Export incident report** — Download JSON incident report for post-mortems (includes LCG seed for data reproduction)
- [x] **D — Real-time simulation** — Auto-advancing clock (3s = 1 simulated min). Pause/Resume + 1x/3x/5x speed control

---

## Tech Stack

| Tool | Version | Purpose |
|------|---------|---------|
| React | 18 | UI framework |
| TypeScript | 5.7 | Type safety |
| Vite | 6 | Build tool + dev server |
| Tailwind CSS | v4 | Styling (via @tailwindcss/vite) |
| Recharts | 2.13 | Data visualizations |
| Zustand | 5 | Global state + simulation clock |
| date-fns | 4 | Date utilities |
| Vitest | 3 | Unit tests |

---

## How the Simulation Works

The dashboard replays a 3-hour payment processor incident in real-time:

- **Clock**: `setInterval` fires every **3 real seconds** → advances `currentSimulatedTime` by **1 simulated minute**
- **Full incident replay**: 3 hours × 60 min = 180 ticks × 3s = **~9 real minutes** per full loop
- **Speed control**: 1x / 3x / 5x — multiplies the simulated minutes-per-tick (not the interval duration)
- **Loop**: When the simulation reaches 21:00 BRT, it resets to 17:00 BRT and replays
- **All charts** re-derive from `transactions.filter(t => t.timestamp <= currentSimulatedTime)` via `useMemo`

### Incident Phases

| Phase | Simulated Time | Processor A | Processor B | Processor C |
|-------|---------------|-------------|-------------|-------------|
| Pre-incident | 17:00–18:00 | 100% traffic, 94% auth | — | — |
| Incident start | 18:00–18:05 | Degrading (40%→15%) | Ramping up | Ramping up |
| Rerouting | 18:05–18:20 | 10% / 8% auth | 55% / 87% | 35% / 79% |
| Stabilized | 18:20–20:00 | **DOWN** | 58% / 89% | 42% / 81% |
| Recovery | 20:00–21:00 | 35%→60% / 93% | Scaling down | Scaling down |

---

## Data Reproducibility

The dataset is generated deterministically using an **LCG PRNG seeded with 42**.
Every refresh produces identical data. To reproduce the dataset:

```typescript
import { generateIncidentData } from './src/data/generator';
const { transactions, incident } = generateIncidentData(42);
// transactions.length >= 1000
```

Change the seed to generate a different but equally reproducible dataset.

**LCG parameters** (Numerical Recipes):
- `a = 1664525`, `c = 1013904223`, `m = 2^32`

---

## Available Scripts

```bash
npm run dev          # Dev server at localhost:5173
npm run build        # Production build (output: dist/)
npm run preview      # Preview production build
npm run test         # Run all Vitest tests
npm run test:ui      # Open Vitest UI
npm run test:coverage # Run tests with coverage report
npm run lint         # ESLint
```

---

## Deploying to Vercel

The project is pre-configured for Vercel deployment via `vercel.json`.

**Deploy via CLI:**
```bash
npm i -g vercel
vercel --prod
```

**Deploy via GitHub:**
1. Push to your GitHub repository
2. Import the project at [vercel.com/new](https://vercel.com/new)
3. Vercel will auto-detect the Vite framework — no config needed

**Environment variables**: None required (no backend, all data is client-side generated).

---

## Project Structure

```
src/
├── types/index.ts              # All TypeScript interfaces
├── constants/processors.ts     # Shared processor color tokens
├── data/generator.ts           # Seeded LCG mock data generator
├── store/dashboard.store.ts    # Zustand: simulation clock + filters
├── hooks/
│   ├── useSimulation.ts        # setInterval simulation tick
│   ├── useFilteredData.ts      # Filtered transactions (binary search)
│   ├── useTimeBuckets.ts       # Aggregated time buckets for charts
│   └── useIncidentMetrics.ts   # Derived KPIs
├── lib/utils.ts                # formatCurrency, formatPercent, cn()
├── components/
│   ├── layout/                 # DashboardHeader, DashboardLayout
│   ├── incident/               # IncidentBanner, IncidentSummaryCard
│   ├── filters/                # DashboardFilters
│   ├── processors/             # ProcessorCard, ProcessorStatusGrid
│   ├── charts/                 # 5 chart components
│   └── export/                 # ExportButton
└── pages/IncidentDashboard.tsx # Final page assembly
```

---

## Design Decisions

See [DESIGN_DECISIONS.md](./DESIGN_DECISIONS.md) for the full write-up (Deliverable 3).

**Key decisions at a glance:**
- **Line charts for auth rates** — trends and crossovers are instantly readable
- **Stacked bars for volume** — the shift from A → B+C is the main incident story
- **RoutingTimeline above the fold** — primary evidence of smart routing in action
- **`allTransactions` outside Zustand** — prevents serializing 1000+ items per tick
- **Speed via amount-per-tick** — avoids interval recreation on speed change (no jitter)
- **Static Tailwind class strings** — Tailwind v4 scanner requires complete class names

---

## Challenge

See [CHALLENGE.md](./CHALLENGE.md) for the full problem statement and evaluation criteria.
