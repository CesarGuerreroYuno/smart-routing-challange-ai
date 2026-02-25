/**
 * processors.ts — Shared processor color + label tokens
 *
 * [IMP-17] All processor visual tokens live here so that cards, chart lines,
 * stacked bars, and the routing timeline all use the SAME colors.
 * Never hardcode processor colors anywhere else in the codebase.
 */

import type { ProcessorId, ProcessorStatus } from '../types';

export const PROCESSOR_META: Record<
  ProcessorId,
  { label: string; shortLabel: string; role: string }
> = {
  'processor-a': { label: 'Processor A', shortLabel: 'A', role: 'Primary' },
  'processor-b': { label: 'Processor B', shortLabel: 'B', role: 'Backup' },
  'processor-c': { label: 'Processor C', shortLabel: 'C', role: 'Backup' },
};

// Hex values for Recharts (LineChart, BarChart) — can't use Tailwind classes in SVG
export const PROCESSOR_HEX: Record<ProcessorId, string> = {
  'processor-a': '#3b82f6', // blue-500
  'processor-b': '#10b981', // emerald-500
  'processor-c': '#f59e0b', // amber-500
};

// [IMP-14] Full static Tailwind class strings — Tailwind v4 scanner cannot
// detect dynamically constructed classes like `text-${color}-500`
export const PROCESSOR_TAILWIND: Record<
  ProcessorId,
  { text: string; bg: string; border: string; ring: string }
> = {
  'processor-a': {
    text: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/40',
    ring: 'ring-blue-500/30',
  },
  'processor-b': {
    text: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/40',
    ring: 'ring-emerald-500/30',
  },
  'processor-c': {
    text: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/40',
    ring: 'ring-amber-500/30',
  },
};

// [IMP-14] Static class strings for ProcessorStatus — never use template literals
export const STATUS_CLASSES: Record<
  ProcessorStatus,
  { badge: string; border: string; dot: string }
> = {
  healthy: {
    badge: 'bg-green-500/15 text-green-400 border border-green-500/30',
    border: 'border-green-500/40',
    dot: 'bg-green-400',
  },
  degraded: {
    badge: 'bg-orange-500/15 text-orange-400 border border-orange-500/30',
    border: 'border-orange-500/40',
    dot: 'bg-orange-400 animate-pulse',
  },
  down: {
    badge: 'bg-red-500/15 text-red-400 border border-red-500/30',
    border: 'border-red-500/40',
    dot: 'bg-red-400 animate-pulse',
  },
};

// [IMP-14] Alert threshold classes — static strings for dynamic states
export const ALERT_THRESHOLD_CLASSES = {
  critical: {
    card: 'border-red-500/60 ring-2 ring-red-500/20',
    badge: 'bg-red-500/20 text-red-300 border border-red-500/40 animate-pulse',
    label: 'CRITICAL',
  },
  warning: {
    card: 'border-orange-500/60 ring-1 ring-orange-500/20',
    badge: 'bg-orange-500/20 text-orange-300 border border-orange-500/40',
    label: 'WARNING',
  },
  normal: {
    card: 'border-zinc-700/60',
    badge: '',
    label: '',
  },
} as const;

export type AlertLevel = keyof typeof ALERT_THRESHOLD_CLASSES;

/** Derives alert level from auth rate vs threshold */
export function getAlertLevel(authRate: number, threshold: number): AlertLevel {
  if (authRate < threshold * 0.5) return 'critical';
  if (authRate < threshold) return 'warning';
  return 'normal';
}

export const PROCESSOR_IDS: ProcessorId[] = ['processor-a', 'processor-b', 'processor-c'];
