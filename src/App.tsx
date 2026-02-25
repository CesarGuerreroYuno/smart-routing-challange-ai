import { useSimulation } from './hooks/useSimulation';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { DashboardHeader } from './components/layout/DashboardHeader';
import { IncidentBanner } from './components/incident/IncidentBanner';

export default function App() {
  // Start the simulation clock — [IMP-7] useRef guard handles StrictMode
  useSimulation();

  return (
    <DashboardLayout>
      <IncidentBanner />
      <DashboardHeader />
      {/* IncidentDashboard assembled in Step 9 */}
      <main className="mt-6">
        <p className="text-zinc-500 text-sm text-center">Dashboard components loading…</p>
      </main>
    </DashboardLayout>
  );
}
