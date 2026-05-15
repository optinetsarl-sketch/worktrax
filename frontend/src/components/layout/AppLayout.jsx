import { Sidebar } from './Sidebar.jsx';
import { Topbar } from './Topbar.jsx';

export function AppLayout({ role, page, onNavigate, onLogout, children }) {
  return (
    <div className="app-shell" data-role={role}>
      <Sidebar role={role} page={page} onNavigate={onNavigate} onLogout={onLogout} />
      <main className="main-shell">
        <Topbar page={page} />
        <div className="page-body">{children}</div>
      </main>
    </div>
  );
}
