/**
 * useSimulation.ts — Simulation clock hook
 *
 * Drives the real-time playback of the incident by advancing
 * currentSimulatedTime on a fixed interval.
 *
 * [IMP-7] STRICTMODE GUARD:
 * React 18 StrictMode double-mounts effects in development, which would
 * create two intervals both advancing the clock at double speed. We use
 * a useRef to hold the interval ID and clear it on cleanup, ensuring only
 * one interval is active at any time.
 *
 * [IMP-21] SPEED VIA AMOUNT-PER-TICK (not interval duration):
 * Changing the interval duration to implement speed multipliers would
 * destroy and recreate the setInterval on every speed change, causing
 * visual jitter. Instead, the interval always fires every 3000ms and
 * the speed multiplier controls how many minutes are advanced per tick.
 * The current speed is read from the store INSIDE the callback using
 * getState() to avoid stale closure captures.
 */

import { useEffect, useRef } from 'react';
import { useDashboardStore } from '../store/dashboard.store';

const TICK_INTERVAL_MS = 3000; // real milliseconds per tick
const MINUTES_PER_TICK = 1;    // simulated minutes per tick at 1x speed

export function useSimulation() {
  const isSimulating = useDashboardStore((s) => s.isSimulating);
  const advanceSimulationTime = useDashboardStore((s) => s.advanceSimulationTime);

  // [IMP-7] useRef holds the interval ID — survives re-renders without re-running the effect
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Always clear any existing interval first (handles StrictMode double-mount)
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!isSimulating) return;

    intervalRef.current = setInterval(() => {
      // [IMP-21] Read speed from store state inside callback — avoids stale closure.
      // This means speed changes take effect on the very next tick without
      // recreating the interval.
      advanceSimulationTime(MINUTES_PER_TICK);
    }, TICK_INTERVAL_MS);

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isSimulating, advanceSimulationTime]);
}
