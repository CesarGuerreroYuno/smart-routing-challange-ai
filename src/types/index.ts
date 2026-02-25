// ─── Primitive union types ────────────────────────────────────────────────────

export type ProcessorId = 'processor-a' | 'processor-b' | 'processor-c';
export type ProcessorStatus = 'healthy' | 'degraded' | 'down';
export type Country = 'BR' | 'MX' | 'CO';
export type PaymentMethod = 'credit_card' | 'debit_card' | 'pix' | 'oxxo';
export type TransactionPhase =
  | 'pre_incident'
  | 'incident_start'
  | 'rerouting'
  | 'stabilized'
  | 'recovery';

// [IMP-2] Country-constrained payment method types
// Prevents generator from producing PIX in MX or OXXO in BR
export type BRPaymentMethod = 'credit_card' | 'debit_card' | 'pix';
export type MXPaymentMethod = 'credit_card' | 'debit_card' | 'oxxo';
export type COPaymentMethod = 'credit_card' | 'debit_card';

// [IMP-3] Typed union for routing event types — replaces free-form string
// Each value maps to a specific visual treatment in RoutingTimeline
export type RoutingEventType =
  | 'auth_rate_drop'
  | 'alert_triggered'
  | 'failover_initiated'
  | 'traffic_rerouted'
  | 'processor_down'
  | 'recovery_signal'
  | 'traffic_restored'
  | 'system_recovered';

// ─── Core domain interfaces ───────────────────────────────────────────────────

export interface Transaction {
  id: string;
  timestamp: Date;
  processorId: ProcessorId;
  processorStatus: ProcessorStatus; // [IMP-4] explicit status on each transaction
  country: Country;
  paymentMethod: PaymentMethod;
  amount: number;     // USD
  authorized: boolean;
  isBaseline: boolean;
  phase: TransactionPhase;
}

// [IMP-5] Per-processor bucket data includes baselineAuthRate for overlay charts
export interface ProcessorBucketData {
  authRate: number;
  baselineAuthRate: number; // pre-incident normal rate for this processor
  volume: number;
  authorized: number;
  declined: number;
  status: ProcessorStatus; // [IMP-4]
}

export interface TimeBucket {
  timestamp: Date;
  label: string; // e.g. "18:05"
  processors: Record<ProcessorId, ProcessorBucketData>;
  totalVolume: number;
  overallAuthRate: number;
}

// [IMP-3] RoutingEvent.type is a typed union, not a free string
export interface RoutingEvent {
  id: string;
  timestamp: Date;
  type: RoutingEventType;
  title: string;
  description: string;
  severity: 'critical' | 'warning' | 'info' | 'success';
}

export interface Incident {
  id: string;
  startTime: Date;
  endTime?: Date;
  baselineAuthRate: number; // pre-incident overall auth rate (0.94)
  events: RoutingEvent[];
}

export interface DashboardFilters {
  timePeriod: '15min' | '1hr' | 'since_incident';
  countries: Country[];
  paymentMethods: PaymentMethod[];
}

// ─── Derived / computed interfaces ───────────────────────────────────────────

export interface IncidentMetrics {
  currentAuthRate: number;    // 0–1
  baselineAuthRate: number;   // 0–1
  authRateDelta: number;      // negative = worse than baseline
  totalTransactions: number;
  authorizedCount: number;
  declinedCount: number;
  estimatedRevenueImpact: number; // USD, negative value
  incidentDurationMs: number;
}

export interface ProcessorSummary {
  processorId: ProcessorId;
  status: ProcessorStatus;
  authRate: number;
  baselineAuthRate: number;
  volume: number;
  volumeShare: number; // 0–1 fraction of total volume
}

// ─── Generator output ────────────────────────────────────────────────────────

// [IMP-27] Typed return shape for the standalone generator function
export interface GeneratedData {
  transactions: Transaction[];
  baselineTransactions: Transaction[];
  incident: Incident;
  seed: number;
}
