import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { IncidentBanner } from './IncidentBanner';
import { useDashboardStore, INCIDENT_DATA } from '../../store/dashboard.store';

beforeEach(() => {
  useDashboardStore.setState({ isSimulating: false });
});

describe('IncidentBanner', () => {
  it('[IMP-20] always shows DEMO MODE strip', () => {
    useDashboardStore.setState({
      currentSimulatedTime: new Date('2024-11-15T17:30:00-03:00'),
    });
    render(<IncidentBanner />);
    expect(screen.getByText(/demo mode/i)).toBeDefined();
  });

  it('shows pre-incident state before incident starts', () => {
    useDashboardStore.setState({
      currentSimulatedTime: new Date('2024-11-15T17:30:00-03:00'),
    });
    render(<IncidentBanner />);
    expect(screen.getByText(/pre-incident/i)).toBeDefined();
  });

  it('shows INCIDENT ACTIVE strip after incident start', () => {
    useDashboardStore.setState({
      currentSimulatedTime: new Date(INCIDENT_DATA.startTime.getTime() + 5 * 60_000),
    });
    render(<IncidentBanner />);
    expect(screen.getByText(/incident active/i)).toBeDefined();
  });

  it('displays incident start time', () => {
    useDashboardStore.setState({
      currentSimulatedTime: new Date(INCIDENT_DATA.startTime.getTime() + 5 * 60_000),
    });
    render(<IncidentBanner />);
    expect(screen.getByTestId('incident-start-time')).toBeDefined();
  });

  it('displays incident duration', () => {
    useDashboardStore.setState({
      currentSimulatedTime: new Date(INCIDENT_DATA.startTime.getTime() + 90 * 60_000),
    });
    render(<IncidentBanner />);
    const el = screen.getByTestId('incident-duration');
    expect(el.textContent).toContain('1h');
  });

  it('shows 0s duration at exact incident start', () => {
    useDashboardStore.setState({ currentSimulatedTime: INCIDENT_DATA.startTime });
    render(<IncidentBanner />);
    const el = screen.getByTestId('incident-duration');
    expect(el.textContent).toBe('0s');
  });
});
