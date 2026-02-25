import { describe, it, expect } from 'vitest';
import { generateIncidentData, BASELINE_AUTH_RATES } from './generator';
import type { Country, PaymentMethod } from '../types';

describe('generateIncidentData', () => {
  const { transactions, baselineTransactions, incident, seed } = generateIncidentData(42);

  it('returns the seed used', () => {
    expect(seed).toBe(42);
  });

  it('is deterministic — same seed produces identical data', () => {
    const second = generateIncidentData(42);
    expect(second.transactions.length).toBe(transactions.length);
    expect(second.transactions[0]).toEqual(transactions[0]);
    expect(second.transactions[transactions.length - 1]).toEqual(
      transactions[transactions.length - 1],
    );
  });

  it('different seeds produce different data', () => {
    const other = generateIncidentData(99);
    // Compare a sequence of amounts — probability of all matching by chance is negligible
    const amounts42 = transactions.slice(10, 20).map((t) => t.amount);
    const amounts99 = other.transactions.slice(10, 20).map((t) => t.amount);
    expect(amounts42).not.toEqual(amounts99);
  });

  it('generates at least 1000 incident transactions', () => {
    expect(transactions.length).toBeGreaterThanOrEqual(1000);
  });

  it('generates 24h of baseline transactions', () => {
    expect(baselineTransactions.length).toBeGreaterThan(0);
    expect(baselineTransactions.every((t) => t.isBaseline)).toBe(true);
  });

  it('all transactions have valid processor IDs', () => {
    const validIds = ['processor-a', 'processor-b', 'processor-c'];
    expect(transactions.every((t) => validIds.includes(t.processorId))).toBe(true);
  });

  it('all transactions have valid countries', () => {
    const validCountries: Country[] = ['BR', 'MX', 'CO'];
    expect(transactions.every((t) => validCountries.includes(t.country))).toBe(true);
  });

  it('[IMP-2] PIX only appears in BR transactions', () => {
    const pixTx = transactions.filter((t) => t.paymentMethod === 'pix');
    expect(pixTx.length).toBeGreaterThan(0);
    expect(pixTx.every((t) => t.country === 'BR')).toBe(true);
  });

  it('[IMP-2] OXXO only appears in MX transactions', () => {
    const oxxoTx = transactions.filter((t) => t.paymentMethod === 'oxxo');
    expect(oxxoTx.length).toBeGreaterThan(0);
    expect(oxxoTx.every((t) => t.country === 'MX')).toBe(true);
  });

  it('[IMP-1] all four payment methods appear', () => {
    const methods = new Set(transactions.map((t) => t.paymentMethod));
    const expected: PaymentMethod[] = ['credit_card', 'debit_card', 'pix', 'oxxo'];
    for (const m of expected) {
      expect(methods.has(m)).toBe(true);
    }
  });

  it('all three countries appear with roughly correct distribution', () => {
    const total = transactions.length;
    const brCount = transactions.filter((t) => t.country === 'BR').length;
    const mxCount = transactions.filter((t) => t.country === 'MX').length;
    const coCount = transactions.filter((t) => t.country === 'CO').length;

    // Allow ±10% deviation from target distributions
    expect(brCount / total).toBeCloseTo(0.5, 1);
    expect(mxCount / total).toBeCloseTo(0.3, 1);
    expect(coCount / total).toBeCloseTo(0.2, 1);
  });

  it('processor A is DOWN during stabilized phase', () => {
    const stabilized = transactions.filter((t) => t.phase === 'stabilized');
    const aInStabilized = stabilized.filter((t) => t.processorId === 'processor-a');
    // Processor A should have no transactions during stabilized phase (0% traffic)
    expect(aInStabilized.length).toBe(0);
  });

  it('incident has 8 routing events', () => {
    expect(incident.events.length).toBe(8);
  });

  it('[IMP-3] all routing event types are valid union values', () => {
    const validTypes = [
      'auth_rate_drop',
      'alert_triggered',
      'failover_initiated',
      'traffic_rerouted',
      'processor_down',
      'recovery_signal',
      'traffic_restored',
      'system_recovered',
    ];
    expect(incident.events.every((e) => validTypes.includes(e.type))).toBe(true);
  });

  it('incident events are in chronological order', () => {
    const timestamps = incident.events.map((e) => e.timestamp.getTime());
    for (let i = 1; i < timestamps.length; i++) {
      expect(timestamps[i]).toBeGreaterThan(timestamps[i - 1]);
    }
  });

  it('all transaction amounts are positive', () => {
    expect(transactions.every((t) => t.amount > 0)).toBe(true);
  });

  it('[IMP-5] BASELINE_AUTH_RATES exports expected values', () => {
    expect(BASELINE_AUTH_RATES['processor-a']).toBe(0.94);
    expect(BASELINE_AUTH_RATES['processor-b']).toBe(0.89);
    expect(BASELINE_AUTH_RATES['processor-c']).toBe(0.81);
  });

  it('incident start time is 18:00 BRT', () => {
    // 18:00 BRT = 21:00 UTC (BRT is UTC-3)
    expect(incident.startTime.getUTCHours()).toBe(21);
    expect(incident.startTime.getUTCMinutes()).toBe(0);
  });
});
