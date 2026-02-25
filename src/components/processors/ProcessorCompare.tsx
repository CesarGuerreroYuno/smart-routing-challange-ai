import {
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { useTimeBuckets } from '../../hooks/useTimeBuckets';
import { useFilteredData } from '../../hooks/useFilteredData';
import { PROCESSOR_HEX, PROCESSOR_META, PROCESSOR_IDS } from '../../constants/processors';
import { formatPercent } from '../../lib/utils';
import type { ProcessorId } from '../../types';

function CompareChart({ processorId }: { processorId: ProcessorId }) {
  const transactions = useFilteredData();
  const buckets = useTimeBuckets(transactions);

  const data = buckets.map((b) => ({
    label: b.label,
    authRate: b.processors[processorId].volume > 0 ? b.processors[processorId].authRate : null,
    volume: b.processors[processorId].volume,
  }));

  const color = PROCESSOR_HEX[processorId];
  const meta = PROCESSOR_META[processorId];

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <h3 className="text-xs font-semibold mb-3" style={{ color }}>
        {meta.label} <span className="text-zinc-500 font-normal">({meta.role})</span>
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <ComposedChart data={data} margin={{ top: 4, right: 16, bottom: 0, left: -8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: '#71717a', fontSize: 10 }} tickLine={false} axisLine={false} />
          <YAxis yAxisId="auth" orientation="left" domain={[0, 1]}
            tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
            tick={{ fill: '#71717a', fontSize: 10 }} tickLine={false} axisLine={false} width={32} />
          <YAxis yAxisId="vol" orientation="right"
            tick={{ fill: '#71717a', fontSize: 10 }} tickLine={false} axisLine={false} width={28} />
          <Tooltip
            formatter={(val, name) =>
              name === 'authRate' ? formatPercent(val as number) : `${val} tx`
            }
          />
          <Legend formatter={(v) => <span style={{ color: '#a1a1aa', fontSize: 11 }}>{v === 'authRate' ? 'Auth %' : 'Volume'}</span>} />
          <Bar yAxisId="vol" dataKey="volume" fill={color} fillOpacity={0.2} isAnimationActive={false} />
          <Line yAxisId="auth" type="monotone" dataKey="authRate" stroke={color}
            strokeWidth={2} dot={false} connectNulls={false} isAnimationActive={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ProcessorCompare() {
  return (
    <section aria-label="Processor comparison">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
          Processor Comparison
        </h2>
        <span className="text-xs text-zinc-500">Auth rate + volume per processor</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {PROCESSOR_IDS.map((pid) => (
          <CompareChart key={pid} processorId={pid} />
        ))}
      </div>
    </section>
  );
}
