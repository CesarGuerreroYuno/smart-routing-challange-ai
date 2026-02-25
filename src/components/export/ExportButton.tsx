import { useDashboardStore, INCIDENT_DATA, ALL_TRANSACTIONS } from '../../store/dashboard.store';

export function ExportButton() {
  const filters = useDashboardStore((s) => s.filters);
  const currentSimulatedTime = useDashboardStore((s) => s.currentSimulatedTime);
  const alertThreshold = useDashboardStore((s) => s.alertThreshold);

  function handleExport() {
    const visibleTx = ALL_TRANSACTIONS.filter((t) => t.timestamp <= currentSimulatedTime);
    const authorized = visibleTx.filter((t) => t.authorized).length;

    const report = {
      exportedAt: new Date().toISOString(),
      simulatedTimeAtExport: currentSimulatedTime.toISOString(),
      dataReproduction: { seed: 42, generatorPath: 'src/data/generator.ts', fn: 'generateIncidentData(42)' },
      incident: {
        id: INCIDENT_DATA.id,
        startTime: INCIDENT_DATA.startTime.toISOString(),
        baselineAuthRate: INCIDENT_DATA.baselineAuthRate,
        events: INCIDENT_DATA.events.map((e) => ({
          ...e,
          timestamp: e.timestamp.toISOString(),
        })),
      },
      summary: {
        totalTransactions: visibleTx.length,
        authorizedCount: authorized,
        declinedCount: visibleTx.length - authorized,
        currentAuthRate: visibleTx.length > 0 ? authorized / visibleTx.length : 0,
        estimatedRevenueImpact: -((visibleTx.length - authorized) * 65),
      },
      processorPerformance: ['processor-a', 'processor-b', 'processor-c'].map((pid) => {
        const ptx = visibleTx.filter((t) => t.processorId === pid);
        const pAuth = ptx.filter((t) => t.authorized).length;
        return {
          processorId: pid,
          volume: ptx.length,
          authorized: pAuth,
          authRate: ptx.length > 0 ? pAuth / ptx.length : 0,
        };
      }),
      activeFilters: filters,
      alertThreshold,
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `incident-report-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      onClick={handleExport}
      className="flex items-center gap-1.5 px-3 py-1 rounded border border-zinc-700/60 bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 text-xs font-medium transition-colors"
    >
      ↓ Export
    </button>
  );
}
