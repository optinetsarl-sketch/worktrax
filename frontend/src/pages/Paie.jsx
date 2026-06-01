import { useEffect, useState } from "react";
import http, { fmtMoney } from "../lib/api";
import Layout from "../components/Layout";

export default function Paie() {
  const [list, setList] = useState([]);
  useEffect(() => { http.get("/payroll").then((r) => setList(r.data)); }, []);
  const total = list.reduce((s, p) => s + p.net, 0);
  return (
    <Layout title="Paie">
      <div className="kpi-grid">
        <div className="kpi-card green"><div className="kpi-header"><div className="kpi-icon">💰</div></div><div className="kpi-value">{(total / 1_000_000).toFixed(1)}M</div><div className="kpi-label">Masse salariale (FCFA)</div></div>
        <div className="kpi-card blue"><div className="kpi-header"><div className="kpi-icon">👷</div></div><div className="kpi-value">{list.length}</div><div className="kpi-label">Bulletins générés</div></div>
        <div className="kpi-card orange"><div className="kpi-header"><div className="kpi-icon">⏱️</div></div><div className="kpi-value">{list.reduce((s, p) => s + p.hours, 0)}h</div><div className="kpi-label">Heures totales</div></div>
        <div className="kpi-card red"><div className="kpi-header"><div className="kpi-icon">📋</div></div><div className="kpi-value">{fmtMoney(list.reduce((s, p) => s + p.cnss, 0))}</div><div className="kpi-label">CNSS retenue</div></div>
      </div>
      <div className="panel">
        <div className="panel-header"><div><div className="panel-title">📋 Bulletins de paie — Avril 2026</div></div>
          <div className="panel-actions"><button className="top-btn ghost">📥 Export Excel</button><button className="top-btn primary">📄 Imprimer bulletins</button></div>
        </div>
        <div className="scroll-x">
          <table className="data-table">
            <thead><tr><th>Ouvrier</th><th>Catégorie</th><th>Mois</th><th>Jours</th><th>Heures</th><th>Brut</th><th>CNSS</th><th>Net</th></tr></thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id}>
                  <td>{p.worker_name}</td><td>{p.worker_category}</td><td>{p.month}</td><td>{p.days}</td><td>{p.hours}h</td>
                  <td>{fmtMoney(p.gross)}</td><td>{fmtMoney(p.cnss)}</td><td><strong>{fmtMoney(p.net)}</strong></td>
                </tr>
              ))}
              {!list.length && <tr><td colSpan={8} className="empty">Aucun bulletin</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
