import {
  PROCESSOR_META,
  PROCESSOR_TAILWIND,
  STATUS_CLASSES,
  ALERT_THRESHOLD_CLASSES,
  getAlertLevel,
} from '../../constants/processors';
import { formatPercent, formatDelta, cn } from '../../lib/utils';
import type { ProcessorId, ProcessorStatus } from '../../types';

interface ProcessorCardProps {
  processorId: ProcessorId;
  status: ProcessorStatus;
  authRate: number;
  baselineAuthRate: number;
  volume: number;
  volumeShare: number; // 0–1 fraction of total volume
  alertThreshold: number;
  /** Max volume across all processors (for relative bar sizing) */
  maxVolume: number;
}

export function ProcessorCard({
  processorId,
  status,
  authRate,
  baselineAuthRate,
  volume,
  volumeShare,
  alertThreshold,
  maxVolume,
}: ProcessorCardProps) {
  const meta = PROCESSOR_META[processorId];
  const colors = PROCESSOR_TAILWIND[processorId];
  const statusClasses = STATUS_CLASSES[status];

  // [IMP-14] Stretch A: alert level uses static class lookup — no dynamic template literals
  const alertLevel = status === 'down' ? 'critical' : getAlertLevel(authRate, alertThreshold);
  const alertClasses = ALERT_THRESHOLD_CLASSES[alertLevel];

  const delta = authRate - baselineAuthRate;
  const barWidth = maxVolume > 0 ? (volume / maxVolume) * 100 : 0;

  // [IMP-18] Empty state when no transactions in current window
  const hasData = volume > 0;

  return (
    <div
      data-testid={`processor-card-${processorId}`}
      className={cn(
        'relative rounded-xl border bg-zinc-900 p-4 flex flex-col gap-3 transition-all duration-300',
        alertClasses.card,
        status === 'down' && 'opacity-75',
      )}
    >
      {/* ── Header row ───────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5">
            {/* Processor color dot */}
            <span className={cn('inline-block w-2.5 h-2.5 rounded-full', colors.bg, 'border', colors.border)} />
            <span className={cn('text-sm font-semibold', colors.text)}>
              {meta.label}
            </span>
          </div>
          <span className="text-xs text-zinc-500 ml-4">{meta.role}</span>
        </div>

        <div className="flex flex-col items-end gap-1">
          {/* Status badge */}
          <span
            data-testid={`status-badge-${processorId}`}
            className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider', statusClasses.badge)}
          >
            <span className={cn('w-1.5 h-1.5 rounded-full', statusClasses.dot)} />
            {status}
          </span>

          {/* [IMP-14] Stretch A: alert badge — uses static class strings */}
          {alertClasses.label && (
            <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider', alertClasses.badge)}>
              {alertClasses.label}
            </span>
          )}
        </div>
      </div>

      {/* ── Auth rate ────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-baseline gap-2">
          <span
            data-testid={`auth-rate-${processorId}`}
            className={cn(
              'text-3xl font-bold tabular-nums leading-none',
              !hasData ? 'text-zinc-600' :
              alertLevel === 'critical' ? 'text-red-400' :
              alertLevel === 'warning' ? 'text-orange-400' :
              'text-zinc-100',
            )}
          >
            {hasData ? formatPercent(authRate) : '—'}
          </span>
          {hasData && (
            <span
              className={cn(
                'text-sm font-medium tabular-nums',
                delta >= 0 ? 'text-green-400' : 'text-red-400',
              )}
            >
              {formatDelta(delta)}
            </span>
          )}
        </div>
        <p className="text-[10px] text-zinc-500 mt-0.5">
          Auth rate
          {hasData && (
            <span className="text-zinc-600"> · baseline {formatPercent(baselineAuthRate)}</span>
          )}
        </p>
      </div>

      {/* ── Volume bar ───────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Volume share</span>
          <span className="text-xs font-mono text-zinc-300 tabular-nums">
            {hasData ? `${formatPercent(volumeShare, 0)} · ${volume.toLocaleString()} tx` : '—'}
          </span>
        </div>
        {/* Track */}
        <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
          <div
            data-testid={`volume-bar-${processorId}`}
            className={cn(
              'h-full rounded-full transition-all duration-500',
              status === 'down' ? 'bg-zinc-600' :
              alertLevel === 'critical' ? 'bg-red-500' :
              alertLevel === 'warning' ? 'bg-orange-500' :
              colors.bg.replace('/10', ''),
            )}
            style={{ width: `${barWidth}%` }}
            role="progressbar"
            aria-valuenow={Math.round(barWidth)}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      </div>

      {/* [IMP-18] Down overlay */}
      {status === 'down' && (
        <div className="absolute inset-0 rounded-xl flex items-center justify-center bg-zinc-950/40 pointer-events-none">
          <span className="text-xs font-bold text-red-400 uppercase tracking-widest border border-red-500/40 rounded px-2 py-0.5 bg-zinc-950/80">
            Offline
          </span>
        </div>
      )}
    </div>
  );
}
