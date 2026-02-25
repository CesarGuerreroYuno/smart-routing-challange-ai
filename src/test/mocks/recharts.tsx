/**
 * recharts.tsx — Vitest mock for Recharts components
 *
 * [IMP-16] jsdom reports 0×0 dimensions for all DOM elements, which causes
 * ResponsiveContainer to render nothing (it uses ResizeObserver internally).
 * This mock replaces ResponsiveContainer with a plain div of known dimensions,
 * making all chart component tests work correctly in jsdom.
 *
 * Usage in test files:
 *   vi.mock('recharts', () => import('../../test/mocks/recharts'));
 *
 * Or register globally in vitest.config.ts setupFiles if all chart tests need it.
 */

import * as actual from 'recharts';
import type { ReactNode } from 'react';

export const ResponsiveContainer = ({
  children,
}: {
  children: ReactNode;
  width?: number | string;
  height?: number | string;
}) => (
  <div style={{ width: 800, height: 400 }} data-testid="responsive-container">
    {children}
  </div>
);

// Re-export everything else from recharts unchanged
export const {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ReferenceArea,
} = actual;
