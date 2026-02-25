import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useFilteredData } from '../../hooks/useFilteredData';
import { formatPercent } from '../../lib/utils';
import type { Country } from '../../types';

const COUNTRY_COLORS: Record<Country, string> = {
  BR: '#3b82f6',
  MX: '#10b981',
  CO: '#f59e0b',
};

const BASELINE_AUTH: Record<Country, number> = { BR: 0.94, MX: 0.94, CO: 0.93 };

function CountryTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900/95 p-3 text-xs shadow-xl">
      <p className="font-semibold text-zinc-200 mb-1">{d.country}</p>
      <p className="text-zinc-400">Auth rate: <span className="text-zinc-100 font-mono">{formatPercent(d.authRate)}</span></p>
      <p className="text-zinc-400">Baseline: <span className="text-zinc-100 font-mono">{formatPercent(d.baseline)}</span></p>
      <p className="text-zinc-400">Volume: <span className="text-zinc-100 font-mono">{d.volume} tx</span></p>
    </div>
  );
}

export function CountryHeatmap() {
  const transactions = useFilteredData();

  const data = useMemo(() => {
    const countries: Country[] = ['BR', 'MX', 'CO'];
    return countries
      .map((c) => {
        const tx = transactions.filter((t) => t.country === c);
        const volume = tx.length;
        const authorized = tx.filter((t) => t.authorized).length;
        return {
          country: c,
          authRate: volume > 0 ? authorized / volume : 0,
          baseline: BASELINE_AUTH[c],
          volume,
        };
      })
      .filter((d) => d.volume > 0);
  }, [transactions]);

  return (
    <section aria-label="Auth rate by country">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
          By Country
        </h2>
      </div>
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        {data.length === 0 ? (
          <div className="h-52 flex items-center justify-center">
            <p className="text-xs text-zinc-600">No data for current filters</p>
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={data} layout="vertical" margin={{ top: 0, right: 40, bottom: 0, left: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                <XAxis
                  type="number"
                  domain={[0, 1]}
                  tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                  tick={{ fill: '#71717a', fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="country"
                  tick={{ fill: '#a1a1aa', fontSize: 11, fontWeight: 600 }}
                  tickLine={false}
                  axisLine={false}
                  width={28}
                />
                <Tooltip content={<CountryTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="authRate" radius={[0, 4, 4, 0]} isAnimationActive={false}>
                  {data.map((entry) => (
                    <Cell key={entry.country} fill={COUNTRY_COLORS[entry.country]} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* vs baseline row */}
            <div className="mt-2 flex gap-2 flex-wrap">
              {data.map((d) => {
                const delta = d.authRate - d.baseline;
                return (
                  <div key={d.country} className="flex items-center gap-1.5 bg-zinc-950/40 rounded px-2 py-1">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COUNTRY_COLORS[d.country] }} />
                    <span className="text-[10px] text-zinc-400">{d.country}</span>
                    <span className={`text-[10px] font-mono font-semibold ${delta >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {delta >= 0 ? '+' : ''}{(delta * 100).toFixed(1)}pp
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
