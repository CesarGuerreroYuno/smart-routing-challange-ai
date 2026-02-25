import { useDashboardStore } from '../store/dashboard.store';
import { IncidentSummaryCard } from '../components/incident/IncidentSummaryCard';
import { ProcessorStatusGrid } from '../components/processors/ProcessorStatusGrid';
import { ProcessorCompare } from '../components/processors/ProcessorCompare';
import { RoutingTimeline } from '../components/charts/RoutingTimeline';
import { DashboardFilters } from '../components/filters/DashboardFilters';
import { AuthRateTimeline } from '../components/charts/AuthRateTimeline';
import { VolumeStackedBar } from '../components/charts/VolumeStackedBar';
import { PaymentMethodBreakdown } from '../components/charts/PaymentMethodBreakdown';
import { CountryHeatmap } from '../components/charts/CountryHeatmap';
import { ExportButton } from '../components/export/ExportButton';

export function IncidentDashboard() {
  const comparisonMode = useDashboardStore((s) => s.comparisonMode);

  return (
    <div className="flex flex-col gap-6 py-6">
      {/* ── Incident summary KPIs ──────────────────────────────────── */}
      <IncidentSummaryCard />

      {/* ── Processor cards ───────────────────────────────────────── */}
      <ProcessorStatusGrid />

      {/* ── Routing timeline [IMP-19] above the fold ──────────────── */}
      <RoutingTimeline />

      {/* ── Filters + export row ──────────────────────────────────── */}
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <DashboardFilters />
        </div>
        <ExportButton />
      </div>

      {/* ── Stretch B: comparison mode ────────────────────────────── */}
      {comparisonMode && <ProcessorCompare />}

      {/* ── Primary charts ────────────────────────────────────────── */}
      <AuthRateTimeline />
      <VolumeStackedBar />

      {/* ── Breakdown charts ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <PaymentMethodBreakdown />
        <CountryHeatmap />
      </div>
    </div>
  );
}
