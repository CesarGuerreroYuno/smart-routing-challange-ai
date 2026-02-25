import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ReferenceLine, ReferenceArea, ResponsiveContainer,
} from 'recharts';
import { useTimeBuckets } from '../../hooks/useTimeBuckets';
import { useFilteredData } from '../../hooks/useFilteredData';
import { useDashboardStore } from '../../store/dashboard.store';
import { PROCESSOR_HEX, PROCESSOR_META, PROCESSOR_IDS } from '../../constants/processors';
import { formatPercent, formatTimeLabel } from '../../lib/utils';
import { INCIDENT_START } from '../../store/dashboard.store';

// Recharts custom tooltip
function AuthTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900/95 backdrop-blur p-3 text-xs shadow-xl">
      <p className="text-zinc-400 mb-2 font-medium">{label} BRT</p>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-zinc-300">{entry.name}:</span>
          <span className="font-mono font-semibold" style={{ color: entry.color }}>
            {formatPercent(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function AuthRateTimeline() {
  const transactions = useFilteredData();
  const alertThreshold = useDashboardStore((s) => s.alertThreshold);
  const buckets = useTimeBuckets(transactions);

  // Build chart data: each bucket → one row with one value per processor
  const data = buckets.map((b) => ({
    label: b.label,
    ...PROCESSOR_IDS.reduce<Record<string, number>>((acc, pid) => {
      const v = b.processors[pid].volume;
      acc[pid] = v > 0 ? b.processors[pid].authRate : undefined as any;
      return acc;
    }, {}),
  }));

  const incidentLabel = formatTimeLabel(INCIDENT_START);

  return (
    <section aria-label="Authorization rate over time">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
          Auth Rate Timeline
        </h2>
        <span className="text-xs text-zinc-500">5-min buckets</span>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        {/* [IMP-18] Empty state */}
        {data.length === 0 ? (
          <div className="h-64 flex items-center justify-center">
            <p className="text-xs text-zinc-600">No data for current filters</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: -8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: '#71717a', fontSize: 10 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                domain={[0, 1]}
                tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                tick={{ fill: '#71717a', fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                width={38}
              />
              <Tooltip content={<AuthTooltip />} />
              <Legend
                formatter={(value) => (
                  <span style={{ color: '#a1a1aa', fontSize: 11 }}>
                    {PROCESSOR_META[value as keyof typeof PROCESSOR_META]?.label ?? value}
                  </span>
                )}
              />

              {/* [IMP-5] Alert threshold reference line */}
              <ReferenceLine
                y={alertThreshold}
                stroke="#f59e0b"
                strokeDasharray="4 3"
                strokeWidth={1.5}
                label={{ value: `Alert ${(alertThreshold * 100).toFixed(0)}%`, fill: '#f59e0b', fontSize: 10, position: 'right' }}
              />

              {/* Incident window shading */}
              <ReferenceArea
                x1={incidentLabel}
                fill="#ef4444"
                fillOpacity={0.04}
                stroke="none"
              />

              {/* Incident start line */}
              <ReferenceLine
                x={incidentLabel}
                stroke="#ef4444"
                strokeDasharray="4 3"
                strokeWidth={1.5}
                label={{ value: 'Incident', fill: '#ef4444', fontSize: 10, position: 'insideTopLeft' }}
              />

              {/* One line per processor */}
              {PROCESSOR_IDS.map((pid) => (
                <Line
                  key={pid}
                  type="monotone"
                  dataKey={pid}
                  name={pid}
                  stroke={PROCESSOR_HEX[pid]}
                  strokeWidth={2}
                  dot={false}
                  connectNulls={false}
                  isAnimationActive={false} // [IMP-15]
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}
