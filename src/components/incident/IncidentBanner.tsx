import { useState, useEffect } from 'react';
import { useDashboardStore, INCIDENT_DATA } from '../../store/dashboard.store';
import { formatDuration, formatTimeLabel } from '../../lib/utils';

export function IncidentBanner() {
  const currentSimulatedTime = useDashboardStore((s) => s.currentSimulatedTime);
  const isSimulating = useDashboardStore((s) => s.isSimulating);

  const incidentStart = INCIDENT_DATA.startTime;
  const isIncidentActive = currentSimulatedTime >= incidentStart;

  // Live wall-clock tick for duration counter (updates every real second)
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!isSimulating) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [isSimulating]);

  const durationMs = isIncidentActive
    ? Math.max(0, currentSimulatedTime.getTime() - incidentStart.getTime())
    : 0;

  return (
    <div className="flex flex-col gap-0" role="alert" aria-live="polite">
      {/* [IMP-20] DEMO MODE strip — clearly distinguishes simulation from real data */}
      <div className="flex items-center justify-center gap-2 bg-amber-500/10 border-b border-amber-500/20 py-1 px-4">
        <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">
          Demo Mode
        </span>
        <span className="text-[10px] text-amber-500/70">—</span>
        <span className="text-[10px] text-amber-500/70">
          Simulated data · Seed 42 · Not connected to real processors
        </span>
      </div>

      {/* Incident alert strip */}
      {isIncidentActive ? (
        <div className="flex items-center justify-between gap-4 bg-red-950/60 border-b border-red-800/60 px-4 py-2">
          {/* Left: status */}
          <div className="flex items-center gap-2.5">
            <span className="inline-block w-2 h-2 rounded-full bg-red-400 animate-pulse shrink-0" />
            <span className="text-xs font-bold text-red-300 uppercase tracking-wider">
              Incident Active
            </span>
            <span className="hidden sm:inline text-xs text-red-400/60">·</span>
            <span className="hidden sm:inline text-xs text-red-400/80">
              Processor A degraded — Smart routing active
            </span>
          </div>

          {/* Right: timing info */}
          <div className="flex items-center gap-4 shrink-0">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-[10px] text-red-400/60 uppercase tracking-wider">Started</span>
              <span
                data-testid="incident-start-time"
                className="text-xs font-mono text-red-300"
              >
                {formatTimeLabel(incidentStart)} BRT
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-red-400/60 uppercase tracking-wider">Duration</span>
              <span
                data-testid="incident-duration"
                className="text-xs font-mono font-semibold text-red-200 tabular-nums"
              >
                {formatDuration(durationMs)}
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* Pre-incident strip */
        <div className="flex items-center justify-center gap-2 bg-zinc-900/60 border-b border-zinc-800/60 px-4 py-2">
          <span className="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse shrink-0" />
          <span className="text-xs text-zinc-400">
            Pre-incident — Processor A handling 100% of traffic at 94% auth rate
          </span>
        </div>
      )}
    </div>
  );
}
