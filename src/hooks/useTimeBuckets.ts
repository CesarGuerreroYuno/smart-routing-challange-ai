/**
 * useTimeBuckets.ts — Derived time bucket aggregation
 *
 * Aggregates filtered transactions into 5-minute buckets for time-series charts.
 * Each bucket contains per-processor metrics (authRate, volume, etc.) and
 * the baseline auth rate for overlay comparison.
 *
 * [IMP-11] Kept as a separate hook (not in the store) — derived state via useMemo.
 * [IMP-9] Returns empty array when input is empty (no crashes from NaN/division by zero).
 */

import { useMemo } from 'react';
import { BASELINE_AUTH_RATES } from '../data/generator';
import { formatTimeLabel } from '../lib/utils';
import { PROCESSOR_IDS } from '../constants/processors';
import type { TimeBucket, Transaction, ProcessorId, ProcessorStatus } from '../types';

const BUCKET_SIZE_MS = 5 * 60_000; // 5-minute buckets

export function useTimeBuckets(transactions: Transaction[]): TimeBucket[] {
  return useMemo(() => {
    if (transactions.length === 0) return [];

    // Determine bucket range from min/max timestamps
    const minTs = transactions[0].timestamp.getTime();
    const maxTs = transactions[transactions.length - 1].timestamp.getTime();

    const bucketStart = Math.floor(minTs / BUCKET_SIZE_MS) * BUCKET_SIZE_MS;
    const bucketEnd = Math.ceil(maxTs / BUCKET_SIZE_MS) * BUCKET_SIZE_MS;

    const buckets: TimeBucket[] = [];

    for (let t = bucketStart; t < bucketEnd; t += BUCKET_SIZE_MS) {
      const bucketTs = new Date(t);
      const bucketTsEnd = t + BUCKET_SIZE_MS;

      // Transactions in this bucket
      const inBucket = transactions.filter(
        (tx) => tx.timestamp.getTime() >= t && tx.timestamp.getTime() < bucketTsEnd,
      );

      // Per-processor aggregation
      const processors = {} as TimeBucket['processors'];

      for (const pid of PROCESSOR_IDS) {
        const procTx = inBucket.filter((tx) => tx.processorId === pid);
        const volume = procTx.length;
        const authorized = procTx.filter((tx) => tx.authorized).length;
        const declined = volume - authorized;

        // [IMP-9] Safe division — never NaN
        const authRate = volume > 0 ? authorized / volume : 0;

        // Infer status from the most recent transaction for this processor
        const lastTx = procTx[procTx.length - 1];
        const status: ProcessorStatus = lastTx?.processorStatus ?? 'healthy';

        processors[pid as ProcessorId] = {
          authRate,
          baselineAuthRate: BASELINE_AUTH_RATES[pid as ProcessorId], // [IMP-5]
          volume,
          authorized,
          declined,
          status,
        };
      }

      const totalVolume = inBucket.length;
      const totalAuthorized = inBucket.filter((tx) => tx.authorized).length;
      // [IMP-9] Safe division
      const overallAuthRate = totalVolume > 0 ? totalAuthorized / totalVolume : 0;

      buckets.push({
        timestamp: bucketTs,
        label: formatTimeLabel(bucketTs),
        processors,
        totalVolume,
        overallAuthRate,
      });
    }

    return buckets;
  }, [transactions]);
}
