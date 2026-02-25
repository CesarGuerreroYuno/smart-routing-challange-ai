import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RoutingTimeline } from './RoutingTimeline';
import { useDashboardStore, INCIDENT_DATA } from '../../store/dashboard.store';

beforeEach(() => {
  useDashboardStore.setState({ isSimulating: false });
});

describe('RoutingTimeline', () => {
  it('shows "no events" before incident start', () => {
    useDashboardStore.setState({
      currentSimulatedTime: new Date('2024-11-15T17:30:00-03:00'),
    });
    render(<RoutingTimeline />);
    expect(screen.getByText(/no routing events yet/i)).toBeDefined();
  });

  it('progressively reveals events as simulation advances', () => {
    // At 18:02 BRT, 2 events should be visible (18:00 + 18:02)
    useDashboardStore.setState({
      currentSimulatedTime: new Date(INCIDENT_DATA.startTime.getTime() + 2 * 60_000),
    });
    render(<RoutingTimeline />);
    expect(screen.getByTestId('routing-timeline')).toBeDefined();
    expect(screen.getByTestId('routing-event-evt-1')).toBeDefined();
    expect(screen.getByTestId('routing-event-evt-2')).toBeDefined();
    expect(screen.queryByTestId('routing-event-evt-3')).toBeNull();
  });

  it('shows all 8 events at end of simulation', () => {
    useDashboardStore.setState({
      currentSimulatedTime: new Date(INCIDENT_DATA.startTime.getTime() + 200 * 60_000),
    });
    render(<RoutingTimeline />);
    expect(screen.getByText('8 / 8 events')).toBeDefined();
  });

  it('renders event title and description', () => {
    useDashboardStore.setState({
      currentSimulatedTime: new Date(INCIDENT_DATA.startTime.getTime() + 1 * 60_000),
    });
    render(<RoutingTimeline />);
    expect(screen.getByText(/processor a auth rate drop detected/i)).toBeDefined();
  });
});
