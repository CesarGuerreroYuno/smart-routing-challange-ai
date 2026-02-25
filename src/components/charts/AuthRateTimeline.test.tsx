import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { AuthRateTimeline } from './AuthRateTimeline';
import { useDashboardStore, INCIDENT_DATA } from '../../store/dashboard.store';

// [IMP-16] Mock ResponsiveContainer so jsdom renders chart content
vi.mock('recharts', () => import('../../test/mocks/recharts'));

beforeEach(() => {
  useDashboardStore.setState({
    isSimulating: false,
    alertThreshold: 0.8,
    currentSimulatedTime: new Date(INCIDENT_DATA.startTime.getTime() + 60 * 60_000),
    filters: {
      timePeriod: 'since_incident',
      countries: ['BR', 'MX', 'CO'],
      paymentMethods: ['credit_card', 'debit_card', 'pix', 'oxxo'],
    },
  });
});

describe('AuthRateTimeline', () => {
  it('renders the chart section', () => {
    render(<AuthRateTimeline />);
    expect(screen.getByText(/auth rate timeline/i)).toBeDefined();
  });

  it('[IMP-18] shows empty state when no data', () => {
    useDashboardStore.setState({
      currentSimulatedTime: new Date('2000-01-01T00:00:00Z'),
    });
    render(<AuthRateTimeline />);
    expect(screen.getByText(/no data for current filters/i)).toBeDefined();
  });

  it('[IMP-16] renders ResponsiveContainer via mock', () => {
    render(<AuthRateTimeline />);
    expect(screen.getByTestId('responsive-container')).toBeDefined();
  });
});
