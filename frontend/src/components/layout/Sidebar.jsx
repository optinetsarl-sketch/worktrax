import { ROLES } from '../../config/roles.js';

export function Sidebar({ role, page, onNavigate, onLogout }) {
  const cfg = ROLES[role];
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-title">WORK<span>TRAX</span></div>
        <p>OPTINET SARLU</p>
      </div>
      <nav className="sidebar-nav">
        {cfg.nav.map((item, index) => item.section ? (
          <div className="nav-section" key={`${item.section}-${index}`}>{item.section}</div>
        ) : (
          <button key={item.id} className={`nav-item ${page === item.id ? 'active' : ''}`} onClick={() => onNavigate(item.id)}>
            <span>{item.icon}</span>
            <strong>{item.label}</strong>
            {item.badge ? <em>{item.badge}</em> : null}
          </button>
        ))}
      </nav>
      <div className="sidebar-user">
        <span className="sidebar-avatar" style={{ background: cfg.accent }}>{cfg.initials}</span>
        <div>
          <strong>{cfg.name}</strong>
          <small>{cfg.subtitle}</small>
        </div>
        <button type="button" onClick={onLogout}>→</button>
      </div>
    </aside>
  );
}
