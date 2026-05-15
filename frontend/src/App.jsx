import { useState } from 'react';
import { ROLES } from './config/roles.js';
import { AppLayout } from './components/layout/AppLayout.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { DashboardPage } from './pages/DashboardPage.jsx';
import { WorkersPage } from './pages/WorkersPage.jsx';
import { EnginesPage } from './pages/EnginesPage.jsx';
import { AttendancePage } from './pages/AttendancePage.jsx';
import { CamerasPage } from './pages/CamerasPage.jsx';
import { AbsencesPage } from './pages/AbsencesPage.jsx';
import { PayrollPage } from './pages/PayrollPage.jsx';
import { ReportsPage } from './pages/ReportsPage.jsx';
import { UsersPage } from './pages/UsersPage.jsx';
import { PompisteTerminalPage } from './pages/PompisteTerminalPage.jsx';
import { HRDashboardPage } from './pages/roles/HRDashboardPage.jsx';
import { SupervisorDashboardPage } from './pages/roles/SupervisorDashboardPage.jsx';
import { ControllerTerminalPage } from './pages/roles/ControllerTerminalPage.jsx';
import { ControllerJournalPage } from './pages/roles/ControllerJournalPage.jsx';
import { PompisteHistoryPage } from './pages/roles/PompisteHistoryPage.jsx';
import { getCurrentUser, logout } from './services/authApi.js';

function renderPage(page) {
  switch (page) {
    case 'dashboard': return <DashboardPage />;
    case 'workers': return <WorkersPage />;
    case 'engines': return <EnginesPage />;
    case 'fuel': return <EnginesPage initialTab="fuel" />;
    case 'attendance': return <AttendancePage />;
    case 'cameras': return <CamerasPage />;
    case 'absences': return <AbsencesPage />;
    case 'payroll': return <PayrollPage />;
    case 'reports': return <ReportsPage />;
    case 'users': return <UsersPage />;
    case 'hr-dashboard': return <HRDashboardPage />;
    case 'supervisor-dashboard': return <SupervisorDashboardPage />;
    case 'controller-terminal': return <ControllerTerminalPage />;
    case 'controller-journal': return <ControllerJournalPage />;
    case 'pompiste-terminal': return <PompisteTerminalPage />;
    case 'pompiste-history': return <PompisteHistoryPage />;
    default: return <DashboardPage />;
  }
}

export default function App() {
  const storedUser = getCurrentUser();
  const initialRole = storedUser?.role && ROLES[storedUser.role] ? storedUser.role : null;
  const [role, setRole] = useState(initialRole);
  const [page, setPage] = useState(initialRole ? ROLES[initialRole].defaultPage : 'dashboard');

  if (!role) {
    return <LoginPage onLogin={(session) => { const nextRole = session.user.role; setRole(nextRole); setPage(ROLES[nextRole].defaultPage); }} />;
  }

  return (
    <AppLayout role={role} page={page} onNavigate={setPage} onLogout={() => { logout(); setRole(null); }}>
      {renderPage(page)}
    </AppLayout>
  );
}
