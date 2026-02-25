import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { IncidentSummaryCard } from './IncidentSummaryCard';
import { useDashboardStore, INCIDENT_DATA } from '../../store/dashboard.store';

beforeEach(() => {
  useDashboardStore.setState({
    isSimulating: false,
    currentSimulatedTime: new Date(INCIDENT_DATA.startTime.getTime() + 90 * 60_000),
    filters: {
      timePeriod: 'since_incident',
      countries: ['BR', 'MX', 'CO'],
      paymentMethods: ['credit_card', 'debit_card', 'pix', 'oxxo'],
    },
  });
});

describe('IncidentSummaryCard', () => {
  it('renders 4 KPI cards', () => {
    render(<IncidentSummaryCard />);
    expect(screen.getByText(/auth rate/i)).toBeDefined();
    expect(screen.getByText(/transactions/i)).toBeDefined();
    expect(screen.getByText(/revenue impact/i)).toBeDefined();
    expect(screen.getByText(/duration/i)).toBeDefined();
  });

  it('[IMP-9] renders without crashing when no transactions', () => {
    useDashboardStore.setState({
      currentSimulatedTime: new Date('2000-01-01T00:00:00Z'),
    });
    render(<IncidentSummaryCard />);
    // Auth rate should show 0.0% (not crash with NaN)
    const authRates = screen.getAllByText('0.0%');
    expect(authRates.length).toBeGreaterThan(0);
  });

  it('shows — for duration when before incident start', () => {
    useDashboardStore.setState({
      currentSimulatedTime: new Date('2000-01-01T00:00:00Z'),
    });
    render(<IncidentSummaryCard />);
    expect(screen.getByText('—')).toBeDefined();
  });

  it('shows baseline auth rate in sub text', () => {
    render(<IncidentSummaryCard />);
    expect(screen.getByText(/baseline/)).toBeDefined();
  });

  it('shows incident duration when after incident start', () => {
    render(<IncidentSummaryCard />);
    // 90 min = 1h 30m 0s
    expect(screen.getByText('1h 30m 0s')).toBeDefined();
  });
});
