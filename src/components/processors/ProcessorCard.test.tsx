import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProcessorCard } from './ProcessorCard';

const baseProps = {
  processorId: 'processor-a' as const,
  status: 'healthy' as const,
  authRate: 0.94,
  baselineAuthRate: 0.94,
  volume: 300,
  volumeShare: 0.6,
  alertThreshold: 0.8,
  maxVolume: 500,
};

describe('ProcessorCard', () => {
  it('renders processor label', () => {
    render(<ProcessorCard {...baseProps} />);
    expect(screen.getByText('Processor A')).toBeDefined();
  });

  it('renders auth rate', () => {
    render(<ProcessorCard {...baseProps} />);
    expect(screen.getByTestId('auth-rate-processor-a').textContent).toContain('94');
  });

  it('renders status badge', () => {
    render(<ProcessorCard {...baseProps} />);
    expect(screen.getByTestId('status-badge-processor-a').textContent).toContain('healthy');
  });

  it('renders volume bar', () => {
    render(<ProcessorCard {...baseProps} />);
    const bar = screen.getByTestId('volume-bar-processor-a');
    expect(bar).toBeDefined();
    // 300/500 = 60%
    expect(bar.style.width).toBe('60%');
  });

  it('[IMP-14] shows CRITICAL badge when authRate < threshold * 0.5', () => {
    render(<ProcessorCard {...baseProps} authRate={0.35} alertThreshold={0.8} />);
    expect(screen.getByText('CRITICAL')).toBeDefined();
  });

  it('[IMP-14] shows WARNING badge when authRate < threshold', () => {
    render(<ProcessorCard {...baseProps} authRate={0.75} alertThreshold={0.8} />);
    expect(screen.getByText('WARNING')).toBeDefined();
  });

  it('[IMP-14] shows no alert badge when authRate >= threshold', () => {
    render(<ProcessorCard {...baseProps} authRate={0.94} alertThreshold={0.8} />);
    expect(screen.queryByText('CRITICAL')).toBeNull();
    expect(screen.queryByText('WARNING')).toBeNull();
  });

  it('[IMP-18] shows em dash when volume is 0', () => {
    render(<ProcessorCard {...baseProps} volume={0} volumeShare={0} maxVolume={0} />);
    expect(screen.getByTestId('auth-rate-processor-a').textContent).toBe('—');
  });

  it('[IMP-18] shows Offline overlay when status is down', () => {
    render(<ProcessorCard {...baseProps} status="down" authRate={0} volume={0} volumeShare={0} />);
    expect(screen.getByText('Offline')).toBeDefined();
  });

  it('shows positive delta in green', () => {
    render(<ProcessorCard {...baseProps} authRate={0.97} baselineAuthRate={0.94} />);
    // delta = +3pp
    const delta = screen.getByText('+3.0pp');
    expect(delta).toBeDefined();
  });

  it('shows negative delta', () => {
    render(<ProcessorCard {...baseProps} authRate={0.75} baselineAuthRate={0.94} />);
    expect(screen.getByText('-19.0pp')).toBeDefined();
  });
});
