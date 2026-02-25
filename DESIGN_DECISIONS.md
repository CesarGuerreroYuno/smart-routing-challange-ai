# Design Decisions — Smart Routing Blackout

> Deliverable 3: 200–400 word explanation of design decisions.

---

## Visualization Strategy

The primary challenge was communicating three simultaneous time series (one per processor) while making the incident "story" immediately readable to a non-technical ops audience.

**Line charts for auth rates** — trends and crossovers are the key signal. When Processor A drops and B/C ramp up, crossing lines tell the story instantly. Bars would hide the transitions.

**Stacked bars for traffic volume** — the shift from 100% Processor A to a B+C split is the core routing narrative. Stacking makes the rebalancing visible at a glance without mental arithmetic.

**Routing timeline above the fold** — this is the primary evidence that smart routing worked. Ops teams arriving mid-incident need to immediately confirm "yes, the system responded." Placing it before the charts means the first question ("did routing fire?") is answered before scrolling.

---

## State Architecture

**`allTransactions` outside Zustand** — the 1000+ transaction array is immutable after generation. Keeping it in the store would serialize it on every state change (every 3 seconds), creating unnecessary GC pressure. Instead it lives as a module constant; hooks derive filtered views via `useMemo`.

**Speed via amount-per-tick, not interval duration** — changing the `setInterval` duration on speed change destroys and recreates the timer, causing visual jitter. Instead the interval always fires every 3000ms and the speed multiplier controls how many simulated minutes advance per tick. Speed changes take effect on the very next tick with zero UI disruption.

**`useRef` guard for StrictMode** — React 18 StrictMode double-mounts effects in development, which would create two simultaneous intervals advancing the clock at double speed. A `useRef` holding the interval ID ensures cleanup on the first unmount, preventing this.

---

## UX Choices

**Demo Mode banner** — ops engineers must distinguish simulated data from live data at a glance. The persistent amber banner eliminates any ambiguity, especially when the dashboard is handed off during an actual incident.

**Static Tailwind class strings** — Tailwind v4's build-time scanner cannot detect dynamically constructed class names like `` `bg-${color}-500` ``. All status and alert colors live in static lookup objects, ensuring every class appears in the final CSS bundle.

**LCG PRNG seeded with 42** — a deterministic generator means every stakeholder sees identical data when reviewing the dashboard. The seed is embedded in the export report so evaluators can independently reproduce the dataset.

**Initial time at 18:30 BRT** — the dashboard loads mid-incident so charts, KPIs, and routing events are immediately populated. The simulation then continues advancing forward, giving the user a live-playback experience from the first second.
