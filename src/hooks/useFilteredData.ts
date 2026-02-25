/**
 * useFilteredData.ts — Derived filtered transaction slice
 *
 * Returns the subset of ALL_TRANSACTIONS that:
 *   1. Have timestamp <= currentSimulatedTime (simulation window)
 *   2. Match the active country filter
 *   3. Match the active payment method filter
 *   4. Fall within the selected time period (15min / 1hr / since_incident)
 *
 * [IMP-11] Computed via useMemo — never stored in Zustand.
 * [IMP-22] Uses binary search (upperBoundIndex) to find the time cutoff
 *          in O(log n) instead of O(n) .filter() on every tick.
 * [IMP-29] Returns empty array (never throws) when no transactions match.
 *
 * @returns {Transaction[]} Filtered transactions, empty array if no matches.
 */

import { useMemo } from 'react';
import { useDashboardStore, ALL_TRANSACTIONS, INCIDENT_START } from '../store/dashboard.store';
import { upperBoundIndex } from '../lib/utils';
import type { Transaction } from '../types';

export function useFilteredData(): Transaction[] {
  const currentSimulatedTime = useDashboardStore((s) => s.currentSimulatedTime);
  const filters = useDashboardStore((s) => s.filters);

  return useMemo(() => {
    if (ALL_TRANSACTIONS.length === 0) return [];

    // ── Step 1: binary search cutoff by simulation time ──────────────────────
    // [IMP-22] ALL_TRANSACTIONS is pre-sorted by timestamp ascending.
    // upperBoundIndex finds the last index where timestamp <= currentSimulatedTime
    // in O(log n), then we slice — much faster than .filter() on 1000+ items.
    const cutoffIndex = upperBoundIndex(
      ALL_TRANSACTIONS,
      (t) => t.timestamp <= currentSimulatedTime,
    );

    if (cutoffIndex === -1) return [];
    const timeSliced = ALL_TRANSACTIONS.slice(0, cutoffIndex + 1);

    // ── Step 2: time period window ────────────────────────────────────────────
    let windowStart: Date;
    switch (filters.timePeriod) {
      case '15min':
        windowStart = new Date(currentSimulatedTime.getTime() - 15 * 60_000);
        break;
      case '1hr':
        windowStart = new Date(currentSimulatedTime.getTime() - 60 * 60_000);
        break;
      case 'since_incident':
      default:
        windowStart = INCIDENT_START;
        break;
    }

    const windowFiltered =
      filters.timePeriod === 'since_incident'
        ? timeSliced.filter((t) => t.timestamp >= INCIDENT_START)
        : timeSliced.filter((t) => t.timestamp >= windowStart);

    if (windowFiltered.length === 0) return [];

    // ── Step 3: country filter ────────────────────────────────────────────────
    const countryFiltered =
      filters.countries.length === 3 // all countries = no filtering needed
        ? windowFiltered
        : windowFiltered.filter((t) => filters.countries.includes(t.country));

    if (countryFiltered.length === 0) return [];

    // ── Step 4: payment method filter ─────────────────────────────────────────
    const methodFiltered =
      filters.paymentMethods.length === 4 // all methods = no filtering needed
        ? countryFiltered
        : countryFiltered.filter((t) => filters.paymentMethods.includes(t.paymentMethod));

    return methodFiltered;
  }, [currentSimulatedTime, filters]);
}
