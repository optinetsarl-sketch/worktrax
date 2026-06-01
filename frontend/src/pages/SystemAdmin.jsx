import { useEffect, useState } from "react";
import http, { ROLE_LABEL, formatDate } from "../lib/api";
import Layout from "../components/Layout";

const ROLE_COLOR = {
  super_admin: "#7f1d1d",
  admin: "#1a3c5e",
  superviseur: "#2563a8",
  rh: "#7c3aed",
  controleur: "#0f766e",
  pompiste: "#f97316",
};

export default function SystemAdmin() {
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const load = () => {
    setLoading(true);
    setErr("");
    http.get("/system/info")
      .then((r) => setInfo(r.data))
      .catch((e) => setErr(e.response?.data?.detail || "Erreur de chargement"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  if (loading) return <Layout title="Tableau de bord IT"><div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>Chargement des données système…</div></Layout>;
  if (err) return <Layout title="Tableau de bord IT"><div style={{ padding: 40, textAlign: "center", color: "#dc2626" }}>⚠️ {err}</div></Layout>;

  const { collections, roles_summary, users, db_name, db_size_mb, storage_mb, version } = info;

  const COLLECTION_LABELS = {
    users: { label: "Utilisateurs", icon: "👥" },
    workers: { label: "Ouvriers", icon: "👷" },
    equipment: { label: "Engins", icon: "🚜" },
    attendance: { label: "Pointages", icon: "📍" },
    absences: { label: "Absences", icon: "📅" },
    fuel: { label: "Carburant", icon: "⛽" },
    payroll: { label: "Paie", icon: "💰" },
  };

  return (
    <Layout title="Tableau de bord IT — Super Admin">
      {/* Header info */}
      <div style={{ background: "linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)", borderRadius: 16, padding: "24px 28px", marginBottom: 24, color: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ fontSize: "2.5rem" }}>🖥️</div>
          <div>
            <div style={{ fontSize: "1.4rem", fontWeight: 800, letterSpacing: "-.5px" }}>WORKTRAX — Administration IT</div>
            <div style={{ opacity: .75, fontSize: ".88rem", marginTop: 2 }}>
              v{version} &nbsp;•&nbsp; Base : <strong>{db_name}</strong> &nbsp;•&nbsp; {db_size_mb} Mo de données &nbsp;•&nbsp; {storage_mb} Mo stockage
            </div>
          </div>
          <button
            onClick={load}
            style={{ marginLeft: "auto", padding: "8px 18px", background: "rgba(255,255,255,.15)", border: "1px solid rgba(255,255,255,.3)", borderRadius: 10, color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: ".82rem" }}
          >
            ↻ Actualiser
          </button>
        </div>
      </div>

      {/* DB collections */}
      <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", marginBottom: 24 }}>
        {Object.entries(COLLECTION_LABELS).map(([col, { label, icon }]) => (
          <div key={col} className="kpi-card blue" style={{ padding: "16px 18px" }}>
            <div style={{ fontSize: "1.5rem", marginBottom: 4 }}>{icon}</div>
            <div className="kpi-value" style={{ fontSize: "1.6rem" }}>{(collections[col] ?? 0).toLocaleString("fr-FR")}</div>
            <div className="kpi-label">{label}</div>
          </div>
        ))}
      </div>

      {/* Roles summary */}
      <div className="panel" style={{ marginBottom: 24 }}>
        <div className="panel-header">
          <div className="panel-title">🎭 Répartition par rôle</div>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", padding: "12px 0 4px" }}>
          {Object.entries(roles_summary).map(([role, count]) => (
            <div key={role} style={{ display: "flex", alignItems: "center", gap: 8, background: (ROLE_COLOR[role] || "#64748b") + "15", border: `1px solid ${ROLE_COLOR[role] || "#64748b"}40`, borderRadius: 10, padding: "8px 16px" }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: ROLE_COLOR[role] || "#64748b" }} />
              <span style={{ fontWeight: 700, color: ROLE_COLOR[role] || "#64748b" }}>{count}</span>
              <span style={{ color: "#64748b", fontSize: ".85rem" }}>{ROLE_LABEL[role] || role}</span>
            </div>
          ))}
        </div>
      </div>

      {/* All users table */}
      <div className="panel">
        <div className="panel-header">
          <div>
            <div className="panel-title">👥 Tous les comptes utilisateurs</div>
            <div className="panel-subtitle">{users?.length} compte{users?.length > 1 ? "s" : ""} enregistré{users?.length > 1 ? "s" : ""}</div>
          </div>
        </div>
        <div className="scroll-x">
          <table className="data-table">
            <thead>
              <tr>
                <th>Utilisateur</th>
                <th>Email</th>
                <th>Rôle</th>
                <th>Site</th>
                <th>Créé le</th>
              </tr>
            </thead>
            <tbody>
              {users?.map((u) => {
                const color = ROLE_COLOR[u.role] || "#64748b";
                const initials = u.name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();
                return (
                  <tr key={u.id}>
                    <td>
                      <div className="worker-info">
                        <div className="worker-avatar" style={{ background: color }}>{initials}</div>
                        <div>
                          <div className="name">{u.name}</div>
                          <div className="meta">{u.id}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontFamily: "monospace", fontSize: ".82rem" }}>{u.email}</td>
                    <td>
                      <span className="badge" style={{ background: color + "20", color }}>
                        {ROLE_LABEL[u.role] || u.role}
                      </span>
                    </td>
                    <td>{u.assigned_site || u.site || <span className="muted">—</span>}</td>
                    <td>{formatDate(u.created_at)}</td>
                  </tr>
                );
              })}
              {!users?.length && <tr><td colSpan={5} className="empty">Aucun compte</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
