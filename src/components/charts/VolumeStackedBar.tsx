import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { useTimeBuckets } from '../../hooks/useTimeBuckets';
import { useFilteredData } from '../../hooks/useFilteredData';
import { PROCESSOR_HEX, PROCESSOR_META, PROCESSOR_IDS } from '../../constants/processors';

function VolumeTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s: number, e: any) => s + (e.value ?? 0), 0);
  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900/95 p-3 text-xs shadow-xl">
      <p className="text-zinc-400 mb-2 font-medium">{label} BRT</p>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.fill }} />
          <span className="text-zinc-300">{entry.name}:</span>
          <span className="font-mono font-semibold text-zinc-100">{entry.value} tx</span>
        </div>
      ))}
      <div className="border-t border-zinc-700 mt-2 pt-1 flex justify-between">
        <span className="text-zinc-500">Total</span>
        <span className="font-mono font-semibold text-zinc-200">{total} tx</span>
      </div>
    </div>
  );
}

export function VolumeStackedBar() {
  const transactions = useFilteredData();
  const buckets = useTimeBuckets(transactions);

  const data = buckets.map((b) => ({
    label: b.label,
    ...PROCESSOR_IDS.reduce<Record<string, number>>((acc, pid) => {
      acc[pid] = b.processors[pid].volume;
      return acc;
    }, {}),
  }));

  return (
    <section aria-label="Transaction volume by processor">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
          Volume by Processor
        </h2>
        <span className="text-xs text-zinc-500">5-min buckets · stacked</span>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        {data.length === 0 ? (
          <div className="h-52 flex items-center justify-center">
            <p className="text-xs text-zinc-600">No data for current filters</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data} margin={{ top: 4, right: 16, bottom: 0, left: -8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: '#71717a', fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: '#71717a', fontSize: 10 }} tickLine={false} axisLine={false} width={28} />
              <Tooltip content={<VolumeTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Legend
                formatter={(v) => (
                  <span style={{ color: '#a1a1aa', fontSize: 11 }}>
                    {PROCESSOR_META[v as keyof typeof PROCESSOR_META]?.label ?? v}
                  </span>
                )}
              />
              {PROCESSOR_IDS.map((pid) => (
                <Bar
                  key={pid}
                  dataKey={pid}
                  name={pid}
                  stackId="volume"
                  fill={PROCESSOR_HEX[pid]}
                  isAnimationActive={false} // [IMP-15]
                  radius={pid === 'processor-c' ? [3, 3, 0, 0] : [0, 0, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}
