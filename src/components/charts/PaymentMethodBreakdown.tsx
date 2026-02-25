import { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useFilteredData } from '../../hooks/useFilteredData';
import { formatPercent } from '../../lib/utils';
import type { PaymentMethod } from '../../types';

const METHOD_COLORS: Record<PaymentMethod, string> = {
  credit_card: '#3b82f6',
  debit_card:  '#8b5cf6',
  pix:         '#10b981',
  oxxo:        '#f59e0b',
};

const METHOD_LABELS: Record<PaymentMethod, string> = {
  credit_card: 'Credit Card',
  debit_card:  'Debit Card',
  pix:         'PIX',
  oxxo:        'OXXO',
};

function MethodTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900/95 p-3 text-xs shadow-xl">
      <p className="font-semibold text-zinc-200 mb-1">{d.name}</p>
      <p className="text-zinc-400">{d.volume} transactions</p>
      <p className="text-zinc-400">{formatPercent(d.authRate)} auth rate</p>
    </div>
  );
}

export function PaymentMethodBreakdown() {
  const transactions = useFilteredData();

  const data = useMemo(() => {
    const methods: PaymentMethod[] = ['credit_card', 'debit_card', 'pix', 'oxxo'];
    return methods
      .map((m) => {
        const tx = transactions.filter((t) => t.paymentMethod === m);
        const volume = tx.length;
        const authorized = tx.filter((t) => t.authorized).length;
        return {
          id: m,
          name: METHOD_LABELS[m],
          volume,
          authRate: volume > 0 ? authorized / volume : 0,
        };
      })
      .filter((d) => d.volume > 0);
  }, [transactions]);

  return (
    <section aria-label="Payment method breakdown">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
          Payment Methods
        </h2>
      </div>
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        {data.length === 0 ? (
          <div className="h-52 flex items-center justify-center">
            <p className="text-xs text-zinc-600">No data for current filters</p>
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={data}
                  dataKey="volume"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  strokeWidth={0}
                  isAnimationActive={false} // [IMP-15]
                >
                  {data.map((entry) => (
                    <Cell key={entry.id} fill={METHOD_COLORS[entry.id as PaymentMethod]} fillOpacity={0.85} />
                  ))}
                </Pie>
                <Tooltip content={<MethodTooltip />} />
                <Legend
                  formatter={(v) => <span style={{ color: '#a1a1aa', fontSize: 11 }}>{v}</span>}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Auth rate table per method */}
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              {data.map((d) => (
                <div key={d.id} className="flex items-center justify-between bg-zinc-950/40 rounded px-2 py-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: METHOD_COLORS[d.id as PaymentMethod] }} />
                    <span className="text-[10px] text-zinc-400">{d.name}</span>
                  </div>
                  <span className="text-[10px] font-mono font-semibold text-zinc-200">
                    {formatPercent(d.authRate)}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
