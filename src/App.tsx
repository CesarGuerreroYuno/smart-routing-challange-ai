import { useSimulation } from './hooks/useSimulation';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { DashboardHeader } from './components/layout/DashboardHeader';
import { IncidentBanner } from './components/incident/IncidentBanner';
import { IncidentDashboard } from './pages/IncidentDashboard';

export default function App() {
  // Start the simulation clock — [IMP-7] useRef guard handles StrictMode
  useSimulation();

  return (
    <DashboardLayout>
      <IncidentBanner />
      <DashboardHeader />
      <IncidentDashboard />
    </DashboardLayout>
  );
}
