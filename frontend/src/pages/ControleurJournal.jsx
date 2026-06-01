import { useEffect, useState } from "react";
import http, { formatTime } from "../lib/api";
import Layout from "../components/Layout";

export default function ControleurJournal() {
  const [d, setD] = useState(null);
  useEffect(() => { http.get("/dashboard/controleur").then((r) => setD(r.data)); }, []);
  if (!d) return <Layout title="Journal pointage"><div>Chargement…</div></Layout>;
  return (
    <Layout title="Journal des pointages">
      <div className="role-banner controleur">
        <div className="rb-icon">📋</div>
        <div><h2>Journal des pointages — Aujourd'hui</h2><p>Chantier {d.site}</p></div>
        <div className="rb-right"><div className="rb-time">{new Date().toLocaleTimeString("fr-FR")}</div></div>
      </div>
      <div className="kpi-grid">
        <div className="kpi-card green"><div className="kpi-header"><div className="kpi-icon">✅</div></div><div className="kpi-value">{d.entries_count}</div><div className="kpi-label">Pointés (entrée)</div></div>
        <div className="kpi-card blue"><div className="kpi-header"><div className="kpi-icon">🚪</div></div><div className="kpi-value">{d.exits_count}</div><div className="kpi-label">Pointés (sortie)</div></div>
        <div className="kpi-card orange"><div className="kpi-header"><div className="kpi-icon">⏰</div></div><div className="kpi-value">{d.retards_count}</div><div className="kpi-label">Retards</div></div>
        <div className="kpi-card red"><div className="kpi-header"><div className="kpi-icon">❌</div></div><div className="kpi-value">{d.not_pointed}</div><div className="kpi-label">Non pointés</div></div>
      </div>
      <div className="panel">
        <div className="panel-header"><div><div className="panel-title">📋 Journal complet</div></div></div>
        <div className="scroll-x">
          <table className="data-table">
            <thead><tr><th>#</th><th>Ouvrier</th><th>Type</th><th>Heure</th><th>Méthode</th><th>Statut</th></tr></thead>
            <tbody>
              {d.attendance.map((a, i) => (
                <tr key={a.id}>
                  <td>{String(i + 1).padStart(3, "0")}</td>
                  <td>{a.worker_name}</td>
                  <td><span className={`badge ${a.type === "entry" ? "present" : "absent"}`}>{a.type === "entry" ? "🟢 Entrée" : "🔴 Sortie"}</span></td>
                  <td>{formatTime(a.timestamp)}</td>
                  <td>{a.method === "face" ? "👤 Faciale" : "👆 Empreinte"}</td>
                  <td>{a.late_minutes > 0 ? <span className="badge warning">⏰ Retard {a.late_minutes}min</span> : <span className="badge actif">À l'heure</span>}</td>
                </tr>
              ))}
              {!d.attendance.length && <tr><td colSpan={6} className="empty">Aucun pointage</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
