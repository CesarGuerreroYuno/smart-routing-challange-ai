/**
 * utils.ts — Shared utility functions
 */

/** Combines class names, filtering out falsy values */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Formats a USD amount with compact notation for large values.
 * @example formatCurrency(1234567) → "$1.2M"
 * @example formatCurrency(47230) → "$47,230"
 */
export function formatCurrency(amount: number): string {
  const sign = amount < 0 ? '-' : '';
  const abs = Math.abs(amount);
  if (abs >= 1_000_000) {
    return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
  }
  if (abs >= 1_000) {
    return `${sign}$${abs.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  }
  return `${sign}$${abs.toFixed(2)}`;
}

/**
 * Formats a 0–1 rate as a percentage string.
 * @example formatPercent(0.9412) → "94.1%"
 * @example formatPercent(NaN) → "—"
 */
export function formatPercent(rate: number, decimals = 1): string {
  if (!isFinite(rate) || isNaN(rate)) return '—';
  return `${(rate * 100).toFixed(decimals)}%`;
}

/**
 * Formats a percentage delta with sign.
 * @example formatDelta(-0.209) → "-20.9pp"
 * @example formatDelta(0.05) → "+5.0pp"
 */
export function formatDelta(delta: number): string {
  if (!isFinite(delta) || isNaN(delta)) return '—';
  const sign = delta >= 0 ? '+' : '';
  return `${sign}${(delta * 100).toFixed(1)}pp`;
}

/**
 * Formats milliseconds as "1h 23m 40s" duration string.
 * @example formatDuration(5020000) → "1h 23m 40s"
 */
export function formatDuration(ms: number): string {
  if (ms <= 0) return '0s';
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;

  const parts: string[] = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0 || h > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(' ');
}

/**
 * Formats a Date to "HH:MM" label for chart axes.
 * @example formatTimeLabel(new Date('2024-11-15T21:05:00Z')) → "18:05" (BRT UTC-3)
 */
export function formatTimeLabel(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/Sao_Paulo',
  });
}

/**
 * Binary search: finds the index of the last element where predicate is true.
 * Assumes array is sorted in ascending order by the compared property.
 * Returns -1 if no element satisfies the predicate.
 *
 * [IMP-22] Used to efficiently find the cutoff index in sorted transaction arrays
 * instead of .filter() which is O(n) on every simulation tick.
 */
export function upperBoundIndex<T>(arr: T[], predicate: (item: T) => boolean): number {
  let lo = 0;
  let hi = arr.length - 1;
  let result = -1;

  while (lo <= hi) {
    const mid = (lo + hi) >>> 1;
    if (predicate(arr[mid])) {
      result = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }

  return result;
}
