import { useEffect, useState } from "react";
import http from "../lib/api";
import Layout from "../components/Layout";

export default function SuperviseurDashboard() {
  const [d, setD] = useState(null);
  useEffect(() => { http.get("/dashboard/superviseur").then((r) => setD(r.data)); }, []);
  if (!d) return <Layout title="Mon chantier"><div>Chargement…</div></Layout>;
  return (
    <Layout title="Mon chantier">
      <div className="role-banner superviseur">
        <div className="rb-icon">👷‍♂️</div>
        <div><h2>Espace Superviseur — Chantier {d.site}</h2><p>Suivi opérationnel en temps réel</p></div>
        <div className="rb-right"><div className="rb-time">{new Date().toLocaleTimeString("fr-FR")}</div><div style={{ opacity: .7, fontSize: ".78rem" }}>{new Date().toLocaleDateString("fr-FR")}</div></div>
      </div>
      <div className="kpi-grid">
        <div className="kpi-card green"><div className="kpi-header"><div className="kpi-icon">✅</div></div><div className="kpi-value">{d.workers.present}</div><div className="kpi-label">Présents aujourd'hui</div><div className="kpi-sub">🔴 {d.workers.absent} absents sur {d.workers.total}</div></div>
        <div className="kpi-card blue"><div className="kpi-header"><div className="kpi-icon">⏱️</div></div><div className="kpi-value">{d.total_hours_month}h</div><div className="kpi-label">Heures ce mois</div></div>
        <div className="kpi-card orange"><div className="kpi-header"><div className="kpi-icon">🚜</div></div><div className="kpi-value">{d.equipment.active}/{d.equipment.total}</div><div className="kpi-label">Engins en service</div><div className="kpi-sub">⚠️ {d.equipment.maintenance} maintenance</div></div>
        <div className="kpi-card red"><div className="kpi-header"><div className="kpi-icon">⚠️</div></div><div className="kpi-value">{d.workers.absent}</div><div className="kpi-label">Alertes ouvriers</div></div>
      </div>
      <div className="panel">
        <div className="panel-header"><div><div className="panel-title">👷 Ouvriers — {d.site}</div><div className="panel-subtitle">{d.workers_list.length} ouvriers affectés</div></div></div>
        <div className="scroll-x">
          <table className="data-table">
            <thead><tr><th>Ouvrier</th><th>Métier</th><th>Heures</th><th>Statut</th></tr></thead>
            <tbody>
              {d.workers_list.map((w) => (
                <tr key={w.id}>
                  <td>
                    <div className="worker-info">
                      <div className="worker-avatar" style={{ background: w.color, width: 32, height: 32, fontSize: ".75rem" }}>{w.initials}</div>
                      {w.name}
                    </div>
                  </td>
                  <td>{w.category}</td>
                  <td>{w.hours_month}h</td>
                  <td><span className={`badge ${w.status}`}>● {w.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
