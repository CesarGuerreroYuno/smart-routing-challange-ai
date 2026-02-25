import { describe, it, expect } from 'vitest';
import {
  cn,
  formatCurrency,
  formatPercent,
  formatDelta,
  formatDuration,
  upperBoundIndex,
} from './utils';

describe('cn', () => {
  it('joins classes', () => expect(cn('a', 'b')).toBe('a b'));
  it('filters falsy values', () =>
    expect(cn('a', false, undefined, null, 'b')).toBe('a b'));
  it('returns empty string for all falsy', () =>
    expect(cn(false, undefined)).toBe(''));
});

describe('formatCurrency', () => {
  it('formats millions', () => expect(formatCurrency(1_234_567)).toBe('$1.2M'));
  it('formats thousands', () => expect(formatCurrency(47_230)).toBe('$47,230'));
  it('formats small amounts', () => expect(formatCurrency(9.99)).toBe('$9.99'));
  it('handles negative (loss)', () => expect(formatCurrency(-47_230)).toBe('-$47,230'));
});

describe('formatPercent', () => {
  it('formats rate to percent', () => expect(formatPercent(0.9412)).toBe('94.1%'));
  it('formats zero', () => expect(formatPercent(0)).toBe('0.0%'));
  it('formats 100%', () => expect(formatPercent(1)).toBe('100.0%'));
  it('returns em dash for NaN', () => expect(formatPercent(NaN)).toBe('—'));
  it('returns em dash for Infinity', () => expect(formatPercent(Infinity)).toBe('—'));
});

describe('formatDelta', () => {
  it('formats negative delta', () => expect(formatDelta(-0.209)).toBe('-20.9pp'));
  it('formats positive delta with +', () => expect(formatDelta(0.05)).toBe('+5.0pp'));
  it('formats zero delta', () => expect(formatDelta(0)).toBe('+0.0pp'));
  it('returns em dash for NaN', () => expect(formatDelta(NaN)).toBe('—'));
});

describe('formatDuration', () => {
  it('formats hours, minutes, seconds', () =>
    expect(formatDuration(5020000)).toBe('1h 23m 40s'));
  it('formats minutes only', () => expect(formatDuration(90000)).toBe('1m 30s'));
  it('formats seconds only', () => expect(formatDuration(45000)).toBe('45s'));
  it('returns 0s for zero', () => expect(formatDuration(0)).toBe('0s'));
  it('returns 0s for negative', () => expect(formatDuration(-1000)).toBe('0s'));
});

describe('upperBoundIndex', () => {
  const arr = [1, 2, 3, 4, 5];

  it('finds correct upper bound', () => {
    const idx = upperBoundIndex(arr, (x) => x <= 3);
    expect(idx).toBe(2); // arr[2] = 3
  });

  it('returns last index when all match', () => {
    expect(upperBoundIndex(arr, () => true)).toBe(4);
  });

  it('returns -1 when nothing matches', () => {
    expect(upperBoundIndex(arr, () => false)).toBe(-1);
  });

  it('works on empty array', () => {
    expect(upperBoundIndex([], () => true)).toBe(-1);
  });

  it('[IMP-22] works with Date comparisons', () => {
    const dates = [
      new Date('2024-01-01T10:00:00Z'),
      new Date('2024-01-01T11:00:00Z'),
      new Date('2024-01-01T12:00:00Z'),
    ];
    const cutoff = new Date('2024-01-01T11:30:00Z');
    const idx = upperBoundIndex(dates, (d) => d <= cutoff);
    expect(idx).toBe(1); // 11:00 <= 11:30, 12:00 > 11:30
  });
});
