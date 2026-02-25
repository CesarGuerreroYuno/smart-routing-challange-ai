import { useMemo } from 'react';
import { useDashboardStore, INCIDENT_DATA } from '../../store/dashboard.store';
import { formatTimeLabel, cn } from '../../lib/utils';
import type { RoutingEvent } from '../../types';

// [IMP-14] Static class maps — no dynamic template literals
const SEVERITY_CLASSES: Record<
  RoutingEvent['severity'],
  { dot: string; border: string; badge: string; title: string }
> = {
  critical: {
    dot: 'bg-red-400 ring-4 ring-red-400/20',
    border: 'border-red-500/20',
    badge: 'bg-red-500/15 text-red-300 border border-red-500/30',
    title: 'text-red-300',
  },
  warning: {
    dot: 'bg-orange-400 ring-4 ring-orange-400/20',
    border: 'border-orange-500/20',
    badge: 'bg-orange-500/15 text-orange-300 border border-orange-500/30',
    title: 'text-orange-300',
  },
  info: {
    dot: 'bg-blue-400 ring-4 ring-blue-400/20',
    border: 'border-blue-500/20',
    badge: 'bg-blue-500/15 text-blue-300 border border-blue-500/30',
    title: 'text-blue-300',
  },
  success: {
    dot: 'bg-green-400 ring-4 ring-green-400/20',
    border: 'border-green-500/20',
    badge: 'bg-green-500/15 text-green-300 border border-green-500/30',
    title: 'text-green-300',
  },
};

const SEVERITY_LABEL: Record<RoutingEvent['severity'], string> = {
  critical: 'Critical',
  warning: 'Warning',
  info: 'Info',
  success: 'Resolved',
};

export function RoutingTimeline() {
  const currentSimulatedTime = useDashboardStore((s) => s.currentSimulatedTime);
  const allEvents = INCIDENT_DATA.events;

  // Progressive reveal: only show events that have already occurred [IMP-19]
  const visibleEvents = useMemo(
    () => allEvents.filter((e) => e.timestamp <= currentSimulatedTime),
    [currentSimulatedTime, allEvents],
  );

  return (
    <section aria-label="Routing event timeline">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
          Routing Timeline
        </h2>
        <span className="text-xs text-zinc-500">
          {visibleEvents.length} / {allEvents.length} events
        </span>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        {visibleEvents.length === 0 ? (
          <p className="text-xs text-zinc-600 text-center py-4">
            No routing events yet — pre-incident phase
          </p>
        ) : (
          <ol className="relative" data-testid="routing-timeline">
            {/* Vertical connector line */}
            <div className="absolute left-[7px] top-3 bottom-3 w-px bg-zinc-700/50" aria-hidden />

            {visibleEvents.map((event, idx) => {
              const classes = SEVERITY_CLASSES[event.severity];
              const isLatest = idx === visibleEvents.length - 1;

              return (
                <li
                  key={event.id}
                  data-testid={`routing-event-${event.id}`}
                  className={cn(
                    'relative flex gap-4 pb-5 last:pb-0',
                    isLatest && 'animate-pulse-once',
                  )}
                >
                  {/* Dot */}
                  <div className={cn('relative z-10 w-3.5 h-3.5 rounded-full mt-0.5 shrink-0', classes.dot)} />

                  {/* Content */}
                  <div className={cn('flex-1 rounded-lg border p-3 bg-zinc-950/40', classes.border)}>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider', classes.badge)}>
                          {SEVERITY_LABEL[event.severity]}
                        </span>
                        <span className={cn('text-sm font-medium leading-tight', classes.title)}>
                          {event.title}
                        </span>
                      </div>
                      <time
                        dateTime={event.timestamp.toISOString()}
                        className="text-xs font-mono text-zinc-500 shrink-0 tabular-nums"
                      >
                        {formatTimeLabel(event.timestamp)}
                      </time>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      {event.description}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </section>
  );
}
