import { useDashboardStore } from '../../store/dashboard.store';
import { cn } from '../../lib/utils';
import type { Country, PaymentMethod } from '../../types';

const COUNTRIES: Country[] = ['BR', 'MX', 'CO'];
const METHODS: { id: PaymentMethod; label: string }[] = [
  { id: 'credit_card', label: 'Credit' },
  { id: 'debit_card',  label: 'Debit' },
  { id: 'pix',         label: 'PIX' },
  { id: 'oxxo',        label: 'OXXO' },
];

export function DashboardFilters() {
  const filters = useDashboardStore((s) => s.filters);
  const setFilters = useDashboardStore((s) => s.setFilters);
  const toggleCountry = useDashboardStore((s) => s.toggleCountry);
  const togglePaymentMethod = useDashboardStore((s) => s.togglePaymentMethod);
  const resetFilters = useDashboardStore((s) => s.resetFilters);

  const isDefault =
    filters.timePeriod === 'since_incident' &&
    filters.countries.length === 3 &&
    filters.paymentMethods.length === 4;

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3">
      {/* ── Time Period ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-zinc-500 uppercase tracking-wider whitespace-nowrap">Period</span>
        <div className="flex rounded border border-zinc-700/60 overflow-hidden" role="group" aria-label="Time period">
          {([
            { value: '15min', label: '15 min' },
            { value: '1hr', label: '1 hr' },
            { value: 'since_incident', label: 'Incident' },
          ] as const).map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFilters({ timePeriod: value })}
              aria-pressed={filters.timePeriod === value}
              className={cn(
                'px-2.5 py-1 text-xs font-medium transition-colors border-r border-zinc-700/60 last:border-r-0',
                filters.timePeriod === value
                  ? 'bg-zinc-700 text-zinc-100'
                  : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Country ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Country</span>
        <div className="flex gap-1" role="group" aria-label="Country filter">
          {COUNTRIES.map((c) => {
            const active = filters.countries.includes(c);
            return (
              <button
                key={c}
                onClick={() => toggleCountry(c)}
                aria-pressed={active}
                data-testid={`country-filter-${c}`}
                className={cn(
                  'px-2 py-0.5 rounded border text-xs font-semibold transition-colors',
                  active
                    ? 'bg-blue-500/15 border-blue-500/40 text-blue-300'
                    : 'bg-zinc-900 border-zinc-700/60 text-zinc-500 hover:text-zinc-300',
                )}
              >
                {c}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Payment Method ───────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-zinc-500 uppercase tracking-wider whitespace-nowrap">Method</span>
        <div className="flex gap-1 flex-wrap" role="group" aria-label="Payment method filter">
          {METHODS.map(({ id, label }) => {
            const active = filters.paymentMethods.includes(id);
            return (
              <button
                key={id}
                onClick={() => togglePaymentMethod(id)}
                aria-pressed={active}
                data-testid={`method-filter-${id}`}
                className={cn(
                  'px-2 py-0.5 rounded border text-xs font-medium transition-colors',
                  active
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                    : 'bg-zinc-900 border-zinc-700/60 text-zinc-500 hover:text-zinc-300',
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Reset ────────────────────────────────────────────────────── */}
      {!isDefault && (
        <button
          onClick={resetFilters}
          className="ml-auto text-xs text-zinc-500 hover:text-zinc-300 transition-colors underline underline-offset-2"
        >
          Reset filters
        </button>
      )}
    </div>
  );
}
