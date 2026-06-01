import { useEffect, useState } from "react";
import http, { fmtMoney, formatDate } from "../lib/api";
import Layout from "../components/Layout";

export default function RHDashboard() {
  const [d, setD] = useState(null);
  useEffect(() => { http.get("/dashboard/rh").then((r) => setD(r.data)); }, []);
  if (!d) return <Layout title="Espace RH"><div>Chargement…</div></Layout>;
  return (
    <Layout title="Ressources Humaines">
      <div className="role-banner rh">
        <div className="rb-icon">🧑‍💼</div>
        <div><h2>Espace Ressources Humaines</h2><p>Gestion du personnel, absences, congés et paiements</p></div>
        <div className="rb-right"><div className="rb-time">{new Date().toLocaleTimeString("fr-FR")}</div><div style={{ opacity: .7, fontSize: ".78rem" }}>{new Date().toLocaleDateString("fr-FR")}</div></div>
      </div>
      <div className="kpi-grid">
        <div className="kpi-card blue"><div className="kpi-header"><div className="kpi-icon">👷</div></div><div className="kpi-value">{d.total_workers}</div><div className="kpi-label">Ouvriers actifs</div></div>
        <div className="kpi-card orange"><div className="kpi-header"><div className="kpi-icon">📅</div></div><div className="kpi-value">{d.conges_count}</div><div className="kpi-label">Congés en cours</div></div>
        <div className="kpi-card red"><div className="kpi-header"><div className="kpi-icon">🏥</div></div><div className="kpi-value">{d.maladies_count}</div><div className="kpi-label">Arrêts maladie</div></div>
        <div className="kpi-card green"><div className="kpi-header"><div className="kpi-icon">💰</div></div><div className="kpi-value">{(d.masse_salariale / 1_000_000).toFixed(1)}M</div><div className="kpi-label">Masse salariale (FCFA)</div></div>
      </div>

      <div className="grid-equal">
        <div className="panel">
          <div className="panel-header"><div><div className="panel-title">📋 Demandes en attente</div><div className="panel-subtitle">À traiter aujourd'hui</div></div></div>
          {d.pending_requests.length === 0 && <div className="empty">Aucune demande en attente</div>}
          {d.pending_requests.map((r) => (
            <div key={r.id} style={{ padding: 14, background: "#f8fafc", borderRadius: 10, borderLeft: `4px solid ${r.type === "conge_paye" ? "#7c3aed" : r.type === "maladie" ? "#f59e0b" : "#dc2626"}`, marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: ".9rem" }}>{r.worker_name} — {r.type}</div>
                <div style={{ fontSize: ".77rem", color: "#64748b" }}>Du {formatDate(r.date_from)} au {formatDate(r.date_to)} • {r.days} j</div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button className="top-btn primary" style={{ padding: "5px 10px", fontSize: ".75rem" }}>✓ Valider</button>
                <button className="top-btn ghost" style={{ padding: "5px 10px", fontSize: ".75rem", color: "#dc2626" }}>✗ Refus</button>
              </div>
            </div>
          ))}
        </div>

        <div className="panel">
          <div className="panel-header"><div className="panel-title">📅 Calendrier absences</div></div>
          <div className="scroll-x">
            <table className="data-table">
              <thead><tr><th>Ouvrier</th><th>Type</th><th>Du</th><th>Au</th><th>Statut</th></tr></thead>
              <tbody>
                {d.absences.slice(0, 8).map((a) => (
                  <tr key={a.id}>
                    <td>{a.worker_name}</td>
                    <td>{a.type}</td>
                    <td>{formatDate(a.date_from)}</td>
                    <td>{formatDate(a.date_to)}</td>
                    <td><span className={`badge ${a.statut === "valide" ? "actif" : a.statut === "en_cours" ? "warning" : "absent"}`}>{a.statut}</span></td>
                  </tr>
                ))}
                {!d.absences.length && <tr><td colSpan={5} className="empty">Aucune absence</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header"><div><div className="panel-title">💰 Récapitulatif paie — Avril 2026</div></div><div className="panel-actions"><button className="top-btn ghost">📥 Export Excel</button><button className="top-btn primary">📄 Bulletins PDF</button></div></div>
        <div className="scroll-x">
          <table className="data-table">
            <thead><tr><th>Ouvrier</th><th>Catégorie</th><th>Jours</th><th>Heures</th><th>Brut</th><th>CNSS</th><th>Net</th></tr></thead>
            <tbody>
              {d.payroll.map((p) => (
                <tr key={p.id}><td>{p.worker_name}</td><td>{p.worker_category}</td><td>{p.days}</td><td>{p.hours}h</td><td>{fmtMoney(p.gross)}</td><td>{fmtMoney(p.cnss)}</td><td><strong>{fmtMoney(p.net)}</strong></td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
