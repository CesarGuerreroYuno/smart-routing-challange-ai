import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProcessorStatusGrid } from './ProcessorStatusGrid';
import { useDashboardStore, INCIDENT_DATA } from '../../store/dashboard.store';

beforeEach(() => {
  useDashboardStore.setState({
    currentSimulatedTime: new Date(INCIDENT_DATA.startTime.getTime() + 60 * 60_000),
    filters: {
      timePeriod: 'since_incident',
      countries: ['BR', 'MX', 'CO'],
      paymentMethods: ['credit_card', 'debit_card', 'pix', 'oxxo'],
    },
  });
});

describe('ProcessorStatusGrid', () => {
  it('renders all three processor cards with data', () => {
    render(<ProcessorStatusGrid />);
    expect(screen.getByTestId('processor-card-processor-a')).toBeDefined();
    expect(screen.getByTestId('processor-card-processor-b')).toBeDefined();
    expect(screen.getByTestId('processor-card-processor-c')).toBeDefined();
  });

  it('[IMP-18] renders skeleton when no transactions in window', () => {
    // Set time before any transactions
    useDashboardStore.setState({
      currentSimulatedTime: new Date('2000-01-01T00:00:00Z'),
    });
    render(<ProcessorStatusGrid />);
    // Skeletons show processor names
    expect(screen.getByText('Processor A · Waiting for data…')).toBeDefined();
  });

  it('shows transaction count', () => {
    render(<ProcessorStatusGrid />);
    expect(screen.getByText(/transactions in window/)).toBeDefined();
  });
});
