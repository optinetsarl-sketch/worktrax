import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../lib/auth";
import http, { ROLE_LABEL, formatDate } from "../lib/api";

const MENU = {
  super_admin: [
    { section: "Système IT" },
    { path: "/system", icon: "🖥️", label: "Tableau de bord IT" },
    { path: "/utilisateurs", icon: "👥", label: "Utilisateurs" },
    { section: "Supervision" },
    { path: "/", icon: "📊", label: "Dashboard Admin" },
    { path: "/ouvriers", icon: "👷", label: "Ouvriers" },
    { path: "/engins", icon: "🚜", label: "Engins" },
    { path: "/rapports", icon: "📈", label: "Rapports" },
    { path: "/documentation", icon: "📘", label: "Documentation" },
  ],
  admin: [
    { section: "Pilotage" },
    { path: "/", icon: "📊", label: "Tableau de bord" },
    { path: "/ouvriers", icon: "👷", label: "Ouvriers" },
    { path: "/engins", icon: "🚜", label: "Engins" },
    { path: "/pointage", icon: "📍", label: "Pointage" },
    { path: "/carburant", icon: "⛽", label: "Carburant" },
    { section: "Gestion" },
    { path: "/absences", icon: "📅", label: "Absences & Congés" },
    { path: "/sous-traitants", icon: "🏢", label: "Sous-traitants" },
    { path: "/paie", icon: "💰", label: "Paie" },
    { path: "/cameras", icon: "📹", label: "Caméras" },
    { path: "/rapports", icon: "📈", label: "Rapports" },
    { section: "Administration" },
    { path: "/utilisateurs", icon: "👥", label: "Utilisateurs" },
    { path: "/documentation", icon: "📘", label: "Documentation" },
  ],
  superviseur: [
    { path: "/superviseur", icon: "👷‍♂️", label: "Mon chantier" },
    { path: "/superviseur-controleurs", icon: "📍", label: "Contrôleurs sites" },
    { path: "/ouvriers", icon: "👷", label: "Ouvriers" },
    { path: "/engins", icon: "🚜", label: "Engins" },
    { path: "/sous-traitants", icon: "🏢", label: "Sous-traitants" },
    { path: "/pointage", icon: "📍", label: "Pointage" },
    { path: "/cameras", icon: "📹", label: "Caméras" },
    { path: "/documentation", icon: "📘", label: "Documentation" },
  ],
  rh: [
    { path: "/rh", icon: "🧑‍💼", label: "Espace RH" },
    { path: "/ouvriers", icon: "👷", label: "Ouvriers" },
    { path: "/sous-traitants", icon: "🏢", label: "Sous-traitants" },
    { path: "/absences", icon: "📅", label: "Absences & Congés" },
    { path: "/paie", icon: "💰", label: "Paie" },
    { path: "/documentation", icon: "📘", label: "Documentation" },
  ],
  controleur: [
    { path: "/controleur", icon: "📱", label: "Terminal pointage" },
    { path: "/controleur-journal", icon: "📋", label: "Journal du jour" },
    { path: "/documentation", icon: "📘", label: "Documentation" },
  ],
  pompiste: [
    { path: "/pompiste", icon: "⛽", label: "Terminal carburant" },
    { path: "/pompiste-rapport", icon: "📊", label: "Rapport conso." },
    { path: "/documentation", icon: "📘", label: "Documentation" },
  ],
};

export default function Layout({ children, title }) {
  const { user, logout } = useAuth();
  const loc = useLocation();
  const [now, setNow] = useState(new Date());
  const [showNotif, setShowNotif] = useState(false);
  const [contractsNotif, setContractsNotif] = useState({ count: 0, urgent_count: 0, items: [] });
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const canViewContracts = useMemo(
    () => ["super_admin", "admin", "rh", "superviseur"].includes(user?.role),
    [user?.role]
  );
  useEffect(() => {
    if (!canViewContracts) {
      setContractsNotif({ count: 0, urgent_count: 0, items: [] });
      return;
    }
    http.get("/contracts/expiring", { params: { days: 90 } })
      .then((r) => setContractsNotif(r.data))
      .catch(() => setContractsNotif({ count: 0, urgent_count: 0, items: [] }));
  }, [canViewContracts, user?.site]);
  useEffect(() => {
    setShowNotif(false);
  }, [loc.pathname]);
  const menu = MENU[user?.role] || [];
  const initials = (user?.name || "?").split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div className="layout">
      <aside className="sidebar" data-testid="sidebar">
        <div className="sidebar-logo">
          <h1>WORK<span>TRAX</span></h1>
          <p>OPTINET SARLU</p>
        </div>
        <nav>
          {menu.map((m, i) =>
            m.section ? (
              <div key={i} className="nav-section">{m.section}</div>
            ) : (
              <Link
                key={m.path}
                to={m.path}
                className={`nav-item ${loc.pathname === m.path ? "active" : ""}`}
                data-testid={`nav-${m.label.toLowerCase().replace(/[^a-z]/g, "-")}`}
              >
                <span className="nav-icon">{m.icon}</span>
                <span>{m.label}</span>
              </Link>
            )
          )}
        </nav>
        <div className="sidebar-user">
          <div className="sidebar-avatar">{initials}</div>
          <div className="sidebar-user-info">
            <div className="name">{user?.name}</div>
            <div className="role">{ROLE_LABEL[user?.role]}</div>
          </div>
          <button className="logout-btn" onClick={logout} data-testid="logout-btn" title="Déconnexion">↪</button>
        </div>
      </aside>
      <div className="main-area">
        <div className="topbar">
          <h3>{title || "Tableau de bord"}</h3>
          <div className="topbar-right">
            <div className="muted" style={{ fontSize: ".82rem" }}>
              {now.toLocaleString("fr-FR", { weekday: "long", day: "numeric", month: "long" })} • {now.toLocaleTimeString("fr-FR")}
            </div>
            <div style={{ position: "relative" }}>
              <button
                className="notif-btn"
                onClick={() => setShowNotif((s) => !s)}
                title="Notifications"
                data-testid="notif-btn"
              >
                🔔
                {canViewContracts && contractsNotif.count > 0 && <span className="notif-dot" />}
              </button>
              {showNotif && canViewContracts && (
                <div
                  style={{
                    position: "absolute",
                    top: 46,
                    right: 0,
                    width: 360,
                    background: "#fff",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    boxShadow: "var(--shadow-lg)",
                    padding: 12,
                    zIndex: 20,
                  }}
                  data-testid="notif-panel"
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <strong style={{ fontSize: ".9rem" }}>Contrats expirants</strong>
                    <span className="badge warning">{contractsNotif.count}</span>
                  </div>
                  {contractsNotif.items?.slice(0, 5).map((item) => (
                    <div
                      key={`${item.worker_id}-${item.contract_end}`}
                      style={{ padding: "8px 6px", borderBottom: "1px solid #f1f5f9", fontSize: ".8rem" }}
                    >
                      <div style={{ fontWeight: 700 }}>{item.worker_name}</div>
                      <div className="muted" style={{ fontSize: ".72rem" }}>
                        {item.structure} • {item.site}
                      </div>
                      <div style={{ marginTop: 2 }}>
                        <span
                          className={`badge ${item.days_left <= 30 ? "absent" : "warning"}`}
                          style={{ fontSize: ".68rem" }}
                        >
                          {item.days_left < 0
                            ? `Expiré depuis ${Math.abs(item.days_left)}j`
                            : `Expire dans ${item.days_left}j (${formatDate(item.contract_end)})`}
                        </span>
                      </div>
                    </div>
                  ))}
                  {!contractsNotif.items?.length && (
                    <div className="empty" style={{ padding: 14, fontSize: ".8rem" }}>
                      Aucun contrat à échéance.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="page-content">{children}</div>
      </div>
    </div>
  );
}
