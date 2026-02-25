import { useMemo } from 'react';
import { ProcessorCard } from './ProcessorCard';
import { useFilteredData } from '../../hooks/useFilteredData';
import { useDashboardStore } from '../../store/dashboard.store';
import { PROCESSOR_IDS, PROCESSOR_META } from '../../constants/processors';
import { BASELINE_AUTH_RATES } from '../../data/generator';
import type { ProcessorSummary, ProcessorId, ProcessorStatus } from '../../types';

export function ProcessorStatusGrid() {
  const alertThreshold = useDashboardStore((s) => s.alertThreshold);
  const transactions = useFilteredData();

  // Derive per-processor summaries from filtered transactions
  const summaries: ProcessorSummary[] = useMemo(() => {
    const total = transactions.length;

    return PROCESSOR_IDS.map((pid) => {
      const procTx = transactions.filter((t) => t.processorId === pid);
      const volume = procTx.length;
      const authorized = procTx.filter((t) => t.authorized).length;

      // [IMP-9] Safe division
      const authRate = volume > 0 ? authorized / volume : 0;
      const volumeShare = total > 0 ? volume / total : 0;

      // Infer current status from most recent transaction for this processor
      const lastTx = procTx[procTx.length - 1];
      const status: ProcessorStatus = lastTx?.processorStatus ?? 'healthy';

      return {
        processorId: pid,
        status,
        authRate,
        baselineAuthRate: BASELINE_AUTH_RATES[pid],
        volume,
        volumeShare,
      };
    });
  }, [transactions]);

  const maxVolume = Math.max(...summaries.map((s) => s.volume), 1);

  return (
    <section aria-label="Processor status">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
          Processor Status
        </h2>
        <span className="text-xs text-zinc-500">
          {transactions.length.toLocaleString()} transactions in window
        </span>
      </div>

      {/* [IMP-18] Empty state */}
      {transactions.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {PROCESSOR_IDS.map((pid) => (
            <div
              key={pid}
              className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 flex flex-col gap-3 animate-pulse"
            >
              <div className="flex items-center justify-between">
                <div className="h-4 w-28 bg-zinc-800 rounded" />
                <div className="h-5 w-16 bg-zinc-800 rounded-full" />
              </div>
              <div className="h-8 w-20 bg-zinc-800 rounded" />
              <div className="h-1.5 w-full bg-zinc-800 rounded-full" />
              <p className="text-xs text-zinc-600 text-center pt-1">
                {PROCESSOR_META[pid].label} · Waiting for data…
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {summaries.map((summary) => (
            <ProcessorCard
              key={summary.processorId}
              processorId={summary.processorId as ProcessorId}
              status={summary.status}
              authRate={summary.authRate}
              baselineAuthRate={summary.baselineAuthRate}
              volume={summary.volume}
              volumeShare={summary.volumeShare}
              alertThreshold={alertThreshold}
              maxVolume={maxVolume}
            />
          ))}
        </div>
      )}
    </section>
  );
}
