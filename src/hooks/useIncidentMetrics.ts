/**
 * useIncidentMetrics.ts — Derived KPI metrics hook
 *
 * Computes high-level incident metrics from the filtered transaction set.
 *
 * [IMP-9] ALL metrics have defensive fallbacks:
 * - Division results are guarded against zero-length arrays
 * - NaN is converted to 0 before returning
 * - Revenue impact uses a safe avg ticket calculation
 *
 * [IMP-29] Return value contract when input is empty:
 * - currentAuthRate: 0
 * - authRateDelta: 0 (no change from baseline)
 * - totalTransactions: 0
 * - authorizedCount: 0
 * - declinedCount: 0
 * - estimatedRevenueImpact: 0
 * - incidentDurationMs: live counter from incident.startTime
 *
 * @param transactions - Filtered transactions from useFilteredData()
 * @returns IncidentMetrics — safe for direct rendering, no NaN/undefined values
 */

import { useMemo } from 'react';
import { useDashboardStore, INCIDENT_DATA } from '../store/dashboard.store';
import type { IncidentMetrics } from '../types';

// Average ticket size used for revenue impact estimation (USD)
const AVG_TICKET_USD = 65;

export function useIncidentMetrics(transactions: { authorized: boolean; amount: number }[]): IncidentMetrics {
  const currentSimulatedTime = useDashboardStore((s) => s.currentSimulatedTime);
  const baselineAuthRate = INCIDENT_DATA.baselineAuthRate; // 0.94

  return useMemo(() => {
    const total = transactions.length;

    // [IMP-9] Guard against empty input
    if (total === 0) {
      const durationMs = Math.max(
        0,
        currentSimulatedTime.getTime() - INCIDENT_DATA.startTime.getTime(),
      );
      return {
        currentAuthRate: 0,
        baselineAuthRate,
        authRateDelta: 0,
        totalTransactions: 0,
        authorizedCount: 0,
        declinedCount: 0,
        estimatedRevenueImpact: 0,
        incidentDurationMs: durationMs,
      };
    }

    const authorizedCount = transactions.filter((t) => t.authorized).length;
    const declinedCount = total - authorizedCount;

    // [IMP-9] Safe division
    const currentAuthRate = total > 0 ? authorizedCount / total : 0;
    const authRateDelta = currentAuthRate - baselineAuthRate;

    // Revenue impact = declined transactions × avg ticket
    // Negative because it represents lost revenue
    const estimatedRevenueImpact = -(declinedCount * AVG_TICKET_USD);

    // Live duration from incident start to current simulated time
    const incidentDurationMs = Math.max(
      0,
      currentSimulatedTime.getTime() - INCIDENT_DATA.startTime.getTime(),
    );

    return {
      currentAuthRate,
      baselineAuthRate,
      authRateDelta,
      totalTransactions: total,
      authorizedCount,
      declinedCount,
      estimatedRevenueImpact,
      incidentDurationMs,
    };
  }, [transactions, currentSimulatedTime, baselineAuthRate]);
}
