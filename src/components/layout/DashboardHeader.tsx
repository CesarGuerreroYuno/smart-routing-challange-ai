import { useDashboardStore } from '../../store/dashboard.store';
import { formatTimeLabel } from '../../lib/utils';

const SPEEDS = [1, 3, 5] as const;

export function DashboardHeader() {
  const isSimulating = useDashboardStore((s) => s.isSimulating);
  const simulationSpeed = useDashboardStore((s) => s.simulationSpeed);
  const comparisonMode = useDashboardStore((s) => s.comparisonMode);
  const alertThreshold = useDashboardStore((s) => s.alertThreshold);
  const currentSimulatedTime = useDashboardStore((s) => s.currentSimulatedTime);

  const toggleSimulation = useDashboardStore((s) => s.toggleSimulation);
  const setSimulationSpeed = useDashboardStore((s) => s.setSimulationSpeed);
  const toggleComparisonMode = useDashboardStore((s) => s.toggleComparisonMode);
  const setAlertThreshold = useDashboardStore((s) => s.setAlertThreshold);
  const resetSimulation = useDashboardStore((s) => s.resetSimulation);

  return (
    <header className="sticky top-0 z-30 bg-zinc-950/90 backdrop-blur border-b border-zinc-800/60">
      <div className="flex items-center justify-between gap-4 py-3">
        {/* ── Left: branding + time ─────────────────────────────────── */}
        <div className="flex items-center gap-3 min-w-0">
          {/* LIVE indicator */}
          <div className="flex items-center gap-1.5" aria-label={isSimulating ? 'Live simulation running' : 'Simulation paused'}>
            <span
              className={`inline-block w-2 h-2 rounded-full ${
                isSimulating ? 'bg-green-400 animate-pulse' : 'bg-zinc-500'
              }`}
            />
            <span
              data-testid="live-badge"
              className={`text-xs font-semibold tracking-widest uppercase ${
                isSimulating ? 'text-green-400' : 'text-zinc-500'
              }`}
            >
              {isSimulating ? 'Live' : 'Paused'}
            </span>
          </div>

          <div className="w-px h-4 bg-zinc-700" />

          {/* Title */}
          <div className="min-w-0">
            <h1 className="text-sm font-semibold text-zinc-100 truncate leading-tight">
              Smart Routing Blackout
            </h1>
            <p className="text-xs text-zinc-500 truncate leading-tight">
              VitaShop · Live Fallback Visualizer
            </p>
          </div>
        </div>

        {/* ── Center: simulated clock ───────────────────────────────── */}
        <div className="hidden sm:flex flex-col items-center gap-0.5">
          <span className="text-xs text-zinc-500 uppercase tracking-wider">Simulated time</span>
          <span
            data-testid="simulated-time"
            className="text-sm font-mono font-medium text-zinc-200 tabular-nums"
          >
            {formatTimeLabel(currentSimulatedTime)}{' '}
            <span className="text-zinc-500 text-xs">BRT</span>
          </span>
        </div>

        {/* ── Right: controls ───────────────────────────────────────── */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {/* Alert threshold */}
          <div className="hidden md:flex items-center gap-1.5">
            <label
              htmlFor="alert-threshold"
              className="text-xs text-zinc-500 whitespace-nowrap"
            >
              Alert at
            </label>
            <input
              id="alert-threshold"
              type="number"
              min={0}
              max={100}
              step={1}
              value={Math.round(alertThreshold * 100)}
              onChange={(e) => setAlertThreshold(Number(e.target.value) / 100)}
              className="w-14 text-xs text-center bg-zinc-800 border border-zinc-700 rounded px-1.5 py-1 text-zinc-200 focus:outline-none focus:border-zinc-500"
              aria-label="Alert threshold percentage"
            />
            <span className="text-xs text-zinc-500">%</span>
          </div>

          <div className="hidden md:block w-px h-4 bg-zinc-700" />

          {/* Speed selector */}
          <div className="flex items-center gap-0.5 bg-zinc-900 rounded border border-zinc-700/60 p-0.5" role="group" aria-label="Simulation speed">
            {SPEEDS.map((s) => (
              <button
                key={s}
                onClick={() => setSimulationSpeed(s)}
                aria-pressed={simulationSpeed === s}
                className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                  simulationSpeed === s
                    ? 'bg-zinc-700 text-zinc-100'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* Compare mode toggle */}
          <button
            onClick={toggleComparisonMode}
            aria-pressed={comparisonMode}
            className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-medium transition-colors ${
              comparisonMode
                ? 'bg-blue-500/15 border-blue-500/40 text-blue-400'
                : 'bg-zinc-900 border-zinc-700/60 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Compare
          </button>

          {/* Reset */}
          <button
            onClick={resetSimulation}
            title="Reset simulation"
            className="px-2.5 py-1 rounded border border-zinc-700/60 bg-zinc-900 text-zinc-400 hover:text-zinc-200 text-xs font-medium transition-colors"
          >
            ↺
          </button>

          {/* Pause / Resume */}
          <button
            onClick={toggleSimulation}
            aria-label={isSimulating ? 'Pause simulation' : 'Resume simulation'}
            className={`flex items-center gap-1.5 px-3 py-1 rounded border text-xs font-semibold transition-colors ${
              isSimulating
                ? 'bg-zinc-800 border-zinc-600 text-zinc-200 hover:bg-zinc-700'
                : 'bg-green-500/15 border-green-500/40 text-green-400 hover:bg-green-500/25'
            }`}
          >
            {isSimulating ? (
              <>
                <span className="text-[10px]">⏸</span> Pause
              </>
            ) : (
              <>
                <span className="text-[10px]">▶</span> Resume
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
