import { describe, it, expect, beforeEach } from 'vitest';
import { useDashboardStore, ALL_TRANSACTIONS, BASELINE_TRANSACTIONS, INCIDENT_DATA } from './dashboard.store';

// Reset to initial state before each test
beforeEach(() => {
  useDashboardStore.setState({
    currentSimulatedTime: new Date('2024-11-15T17:00:00-03:00'),
    isSimulating: true,
    simulationSpeed: 1,
    filters: {
      timePeriod: 'since_incident',
      countries: ['BR', 'MX', 'CO'],
      paymentMethods: ['credit_card', 'debit_card', 'pix', 'oxxo'],
    },
    alertThreshold: 0.8,
    comparisonMode: false,
  });
});

describe('module-level constants [IMP-10]', () => {
  it('ALL_TRANSACTIONS is populated outside the store', () => {
    expect(ALL_TRANSACTIONS.length).toBeGreaterThanOrEqual(1000);
  });

  it('ALL_TRANSACTIONS is sorted by timestamp ascending', () => {
    const ts = ALL_TRANSACTIONS.map((t) => t.timestamp.getTime());
    for (let i = 1; i < Math.min(ts.length, 100); i++) {
      expect(ts[i]).toBeGreaterThanOrEqual(ts[i - 1]);
    }
  });

  it('[IMP-6] BASELINE_TRANSACTIONS are populated', () => {
    expect(BASELINE_TRANSACTIONS.length).toBeGreaterThan(0);
  });

  it('INCIDENT_DATA has valid start time', () => {
    expect(INCIDENT_DATA.startTime).toBeInstanceOf(Date);
    expect(INCIDENT_DATA.baselineAuthRate).toBe(0.94);
  });
});

describe('advanceSimulationTime', () => {
  it('advances time by 1 minute', () => {
    const before = useDashboardStore.getState().currentSimulatedTime.getTime();
    useDashboardStore.getState().advanceSimulationTime(1);
    const after = useDashboardStore.getState().currentSimulatedTime.getTime();
    expect(after - before).toBe(60_000);
  });

  it('[IMP-21] respects simulationSpeed multiplier', () => {
    useDashboardStore.setState({ simulationSpeed: 3 });
    const before = useDashboardStore.getState().currentSimulatedTime.getTime();
    useDashboardStore.getState().advanceSimulationTime(1);
    const after = useDashboardStore.getState().currentSimulatedTime.getTime();
    expect(after - before).toBe(3 * 60_000);
  });

  it('loops back to start after simulation window ends', () => {
    // Set time close to the end of the window
    const nearEnd = new Date(new Date('2024-11-15T17:00:00-03:00').getTime() + 239 * 60_000);
    useDashboardStore.setState({ currentSimulatedTime: nearEnd });
    useDashboardStore.getState().advanceSimulationTime(5); // would exceed 240 min
    const resetTime = useDashboardStore.getState().currentSimulatedTime;
    expect(resetTime.getTime()).toBe(new Date('2024-11-15T17:00:00-03:00').getTime());
  });
});

describe('toggleSimulation', () => {
  it('pauses a running simulation', () => {
    useDashboardStore.setState({ isSimulating: true });
    useDashboardStore.getState().toggleSimulation();
    expect(useDashboardStore.getState().isSimulating).toBe(false);
  });

  it('resumes a paused simulation', () => {
    useDashboardStore.setState({ isSimulating: false });
    useDashboardStore.getState().toggleSimulation();
    expect(useDashboardStore.getState().isSimulating).toBe(true);
  });
});

describe('[IMP-8] setSimulationSpeed', () => {
  it('updates simulation speed', () => {
    useDashboardStore.getState().setSimulationSpeed(5);
    expect(useDashboardStore.getState().simulationSpeed).toBe(5);
  });
});

describe('[IMP-8] resetSimulation', () => {
  it('resets time and starts simulation', () => {
    useDashboardStore.setState({
      currentSimulatedTime: new Date(),
      isSimulating: false,
    });
    useDashboardStore.getState().resetSimulation();
    const state = useDashboardStore.getState();
    expect(state.isSimulating).toBe(true);
    expect(state.currentSimulatedTime.getTime()).toBe(
      new Date('2024-11-15T17:00:00-03:00').getTime(),
    );
  });
});

describe('[IMP-8] seekToTime', () => {
  it('jumps to a specific time', () => {
    const target = new Date('2024-11-15T19:00:00-03:00');
    useDashboardStore.getState().seekToTime(target);
    expect(useDashboardStore.getState().currentSimulatedTime.getTime()).toBe(target.getTime());
  });

  it('clamps to simulation window bounds', () => {
    useDashboardStore.getState().seekToTime(new Date('2099-01-01'));
    const t = useDashboardStore.getState().currentSimulatedTime;
    expect(t.getTime()).toBeLessThanOrEqual(
      new Date('2024-11-15T17:00:00-03:00').getTime() + 240 * 60_000,
    );
  });
});

describe('filter actions', () => {
  it('toggleCountry removes a country', () => {
    useDashboardStore.getState().toggleCountry('CO');
    expect(useDashboardStore.getState().filters.countries).not.toContain('CO');
  });

  it('toggleCountry adds a country back', () => {
    useDashboardStore.setState({
      filters: {
        timePeriod: 'since_incident',
        countries: ['BR', 'MX'],
        paymentMethods: ['credit_card', 'debit_card', 'pix', 'oxxo'],
      },
    });
    useDashboardStore.getState().toggleCountry('CO');
    expect(useDashboardStore.getState().filters.countries).toContain('CO');
  });

  it('does not remove last country (guard)', () => {
    useDashboardStore.setState({
      filters: {
        timePeriod: 'since_incident',
        countries: ['BR'],
        paymentMethods: ['credit_card', 'debit_card', 'pix', 'oxxo'],
      },
    });
    useDashboardStore.getState().toggleCountry('BR');
    expect(useDashboardStore.getState().filters.countries).toContain('BR');
  });

  it('resetFilters restores defaults', () => {
    useDashboardStore.getState().toggleCountry('CO');
    useDashboardStore.getState().resetFilters();
    expect(useDashboardStore.getState().filters.countries).toEqual(['BR', 'MX', 'CO']);
  });
});

describe('setAlertThreshold', () => {
  it('sets threshold within 0–1', () => {
    useDashboardStore.getState().setAlertThreshold(0.75);
    expect(useDashboardStore.getState().alertThreshold).toBe(0.75);
  });

  it('clamps to 0 for negative', () => {
    useDashboardStore.getState().setAlertThreshold(-1);
    expect(useDashboardStore.getState().alertThreshold).toBe(0);
  });

  it('clamps to 1 for > 1', () => {
    useDashboardStore.getState().setAlertThreshold(2);
    expect(useDashboardStore.getState().alertThreshold).toBe(1);
  });
});
