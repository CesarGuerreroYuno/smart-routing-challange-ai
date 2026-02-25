import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DashboardHeader } from './DashboardHeader';
import { useDashboardStore } from '../../store/dashboard.store';

beforeEach(() => {
  useDashboardStore.setState({
    isSimulating: true,
    simulationSpeed: 1,
    comparisonMode: false,
    alertThreshold: 0.8,
    currentSimulatedTime: new Date('2024-11-15T18:05:00-03:00'),
  });
});

describe('DashboardHeader', () => {
  it('renders title', () => {
    render(<DashboardHeader />);
    expect(screen.getByText('Smart Routing Blackout')).toBeDefined();
  });

  it('shows LIVE badge when simulating', () => {
    render(<DashboardHeader />);
    expect(screen.getByTestId('live-badge').textContent).toBe('Live');
  });

  it('shows Paused badge when not simulating', () => {
    useDashboardStore.setState({ isSimulating: false });
    render(<DashboardHeader />);
    expect(screen.getByTestId('live-badge').textContent).toBe('Paused');
  });

  it('displays current simulated time', () => {
    render(<DashboardHeader />);
    const timeEl = screen.getByTestId('simulated-time');
    expect(timeEl.textContent).toContain('18:05');
  });

  it('pause button toggles simulation', () => {
    render(<DashboardHeader />);
    const btn = screen.getByRole('button', { name: /pause simulation/i });
    fireEvent.click(btn);
    expect(useDashboardStore.getState().isSimulating).toBe(false);
  });

  it('resume button restarts simulation', () => {
    useDashboardStore.setState({ isSimulating: false });
    render(<DashboardHeader />);
    const btn = screen.getByRole('button', { name: /resume simulation/i });
    fireEvent.click(btn);
    expect(useDashboardStore.getState().isSimulating).toBe(true);
  });

  it('speed buttons update simulationSpeed', () => {
    render(<DashboardHeader />);
    fireEvent.click(screen.getByRole('button', { name: /3x/i }));
    expect(useDashboardStore.getState().simulationSpeed).toBe(3);
  });

  it('active speed button is aria-pressed', () => {
    render(<DashboardHeader />);
    const btn1x = screen.getByRole('button', { name: /1x/i });
    expect(btn1x.getAttribute('aria-pressed')).toBe('true');
    const btn3x = screen.getByRole('button', { name: /3x/i });
    expect(btn3x.getAttribute('aria-pressed')).toBe('false');
  });

  it('compare button toggles comparisonMode', () => {
    render(<DashboardHeader />);
    const btn = screen.getByRole('button', { name: /compare/i });
    fireEvent.click(btn);
    expect(useDashboardStore.getState().comparisonMode).toBe(true);
  });
});
