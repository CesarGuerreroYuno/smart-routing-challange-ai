import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DashboardLayout } from './DashboardLayout';

describe('DashboardLayout', () => {
  it('renders children', () => {
    render(<DashboardLayout><p>hello</p></DashboardLayout>);
    expect(screen.getByText('hello')).toBeDefined();
  });

  it('applies dark background class', () => {
    const { container } = render(<DashboardLayout><span /></DashboardLayout>);
    expect(container.firstChild).toBeDefined();
    const root = container.firstElementChild;
    expect(root?.className).toContain('bg-zinc-950');
  });
});
