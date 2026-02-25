import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDashboardStore } from '../store/dashboard.store';
import { useIncidentMetrics } from './useIncidentMetrics';
import { INCIDENT_DATA } from '../store/dashboard.store';

// Reset store state before each test
beforeEach(() => {
  useDashboardStore.setState({
    currentSimulatedTime: INCIDENT_DATA.startTime,
  });
});

describe('useIncidentMetrics', () => {
  it('[IMP-9] returns safe defaults for empty input', () => {
    const { result } = renderHook(() => useIncidentMetrics([]));
    const m = result.current;
    expect(m.currentAuthRate).toBe(0);
    expect(m.totalTransactions).toBe(0);
    expect(m.authorizedCount).toBe(0);
    expect(m.declinedCount).toBe(0);
    expect(m.estimatedRevenueImpact).toBe(0);
    expect(m.authRateDelta).toBe(0);
  });

  it('[IMP-9] no NaN values in output', () => {
    const { result } = renderHook(() => useIncidentMetrics([]));
    for (const val of Object.values(result.current)) {
      expect(isNaN(val as number)).toBe(false);
    }
  });

  it('calculates correct auth rate', () => {
    const txs = [
      { authorized: true, amount: 50 },
      { authorized: true, amount: 50 },
      { authorized: false, amount: 50 },
      { authorized: false, amount: 50 },
    ];
    const { result } = renderHook(() => useIncidentMetrics(txs));
    expect(result.current.currentAuthRate).toBeCloseTo(0.5);
    expect(result.current.authorizedCount).toBe(2);
    expect(result.current.declinedCount).toBe(2);
    expect(result.current.totalTransactions).toBe(4);
  });

  it('calculates negative revenue impact', () => {
    // 2 declined transactions × $65 avg ticket = -$130
    const txs = [
      { authorized: false, amount: 80 },
      { authorized: false, amount: 80 },
    ];
    const { result } = renderHook(() => useIncidentMetrics(txs));
    expect(result.current.estimatedRevenueImpact).toBeLessThan(0);
  });

  it('calculates authRateDelta vs baseline', () => {
    // 80% current vs 94% baseline = -14pp
    const txs = Array.from({ length: 100 }, (_, i) => ({
      authorized: i < 80,
      amount: 50,
    }));
    const { result } = renderHook(() => useIncidentMetrics(txs));
    expect(result.current.authRateDelta).toBeCloseTo(-0.14, 2);
  });

  it('returns positive incidentDurationMs after incident start', () => {
    useDashboardStore.setState({
      currentSimulatedTime: new Date(INCIDENT_DATA.startTime.getTime() + 30 * 60_000),
    });
    const { result } = renderHook(() => useIncidentMetrics([]));
    expect(result.current.incidentDurationMs).toBeGreaterThan(0);
  });
});
