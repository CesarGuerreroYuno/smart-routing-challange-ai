import { useState, useEffect } from 'react';
import { useFilteredData } from '../../hooks/useFilteredData';
import { useIncidentMetrics } from '../../hooks/useIncidentMetrics';
import { useDashboardStore } from '../../store/dashboard.store';
import { formatPercent, formatDelta, formatCurrency, formatDuration, cn } from '../../lib/utils';

interface KpiCardProps {
  label: string;
  value: string;
  sub?: string;
  subColor?: string;
  accent?: 'red' | 'green' | 'amber' | 'neutral';
}

function KpiCard({ label, value, sub, subColor, accent = 'neutral' }: KpiCardProps) {
  const accentMap = {
    red: 'border-red-500/30',
    green: 'border-green-500/30',
    amber: 'border-amber-500/30',
    neutral: 'border-zinc-700/60',
  };
  return (
    <div className={cn('rounded-xl bg-zinc-900 border p-4 flex flex-col gap-1', accentMap[accent])}>
      <span className="text-[10px] uppercase tracking-wider text-zinc-500">{label}</span>
      <span className="text-2xl font-bold tabular-nums text-zinc-100 leading-tight">{value}</span>
      {sub && (
        <span className={cn('text-xs tabular-nums', subColor ?? 'text-zinc-500')}>{sub}</span>
      )}
    </div>
  );
}

export function IncidentSummaryCard() {
  const isSimulating = useDashboardStore((s) => s.isSimulating);
  const transactions = useFilteredData();
  const metrics = useIncidentMetrics(transactions);

  // Live wall-clock tick so duration updates every real second
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!isSimulating) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [isSimulating]);

  const deltaColor =
    metrics.authRateDelta < -0.1 ? 'text-red-400' :
    metrics.authRateDelta < 0 ? 'text-orange-400' :
    'text-green-400';

  const impactAccent =
    metrics.estimatedRevenueImpact < -10_000 ? 'red' :
    metrics.estimatedRevenueImpact < 0 ? 'amber' :
    'neutral';

  return (
    <section aria-label="Incident summary" className="mt-4">
      <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-3">
        Incident Summary
      </h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* KPI 1: Auth Rate */}
        <KpiCard
          label="Auth Rate"
          value={formatPercent(metrics.currentAuthRate)}
          sub={`${formatPercent(metrics.baselineAuthRate)} baseline · ${formatDelta(metrics.authRateDelta)}`}
          subColor={deltaColor}
          accent={metrics.authRateDelta < -0.1 ? 'red' : metrics.authRateDelta < 0 ? 'amber' : 'green'}
        />

        {/* KPI 2: Transaction Volume */}
        <KpiCard
          label="Transactions"
          value={metrics.totalTransactions.toLocaleString()}
          sub={`${metrics.authorizedCount.toLocaleString()} authorized · ${metrics.declinedCount.toLocaleString()} declined`}
          accent="neutral"
        />

        {/* KPI 3: Revenue Impact */}
        <KpiCard
          label="Est. Revenue Impact"
          value={formatCurrency(metrics.estimatedRevenueImpact)}
          sub={`${metrics.declinedCount.toLocaleString()} declined × $65 avg ticket`}
          subColor="text-zinc-500"
          accent={impactAccent}
        />

        {/* KPI 4: Duration */}
        <KpiCard
          label="Incident Duration"
          value={metrics.incidentDurationMs > 0 ? formatDuration(metrics.incidentDurationMs) : '—'}
          sub="since 18:00 BRT"
          accent="neutral"
        />
      </div>
    </section>
  );
}
