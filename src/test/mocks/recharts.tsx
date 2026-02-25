/**
 * recharts.tsx — Vitest mock for Recharts components
 *
 * [IMP-16] jsdom reports 0×0 dimensions for all DOM elements.
 * ResponsiveContainer uses ResizeObserver and renders nothing in jsdom.
 * This mock replaces every Recharts component with a minimal stub so
 * chart tests can assert on rendered content without hanging.
 *
 * Usage in a test file:
 *   vi.mock('recharts', () => import('../../test/mocks/recharts'));
 */

import type { ReactNode } from 'react';

// Render children in a known-size div
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

// Chart containers — render children so nested components show up
const passthrough =
  (tag = 'div') =>
  ({ children }: { children?: ReactNode; [key: string]: unknown }) =>
    <div data-recharts={tag}>{children}</div>;

export const LineChart = passthrough('LineChart');
export const BarChart = passthrough('BarChart');
export const PieChart = passthrough('PieChart');
export const ComposedChart = passthrough('ComposedChart');

// Leaf components — render nothing (they use SVG internally)
const noop = () => null;

export const Line = noop;
export const Bar = noop;
export const Area = noop;
export const Pie = noop;
export const Cell = noop;
export const XAxis = noop;
export const YAxis = noop;
export const CartesianGrid = noop;
export const Tooltip = noop;
export const Legend = noop;
export const ReferenceLine = noop;
export const ReferenceArea = noop;
