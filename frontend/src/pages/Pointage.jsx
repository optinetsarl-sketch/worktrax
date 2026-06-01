import { useEffect, useState } from "react";
import http, { formatTime } from "../lib/api";
import Layout from "../components/Layout";
import useAttendanceSocket from "../lib/useAttendanceSocket";

export default function Pointage() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("all");
  const [lastUpdate, setLastUpdate] = useState(null);
  const load = () => http.get("/attendance/today").then((r) => setItems(r.data));
  useEffect(() => { load(); }, []);

  // Mise à jour automatique quand un nouveau pointage arrive (HikVision ou manuel)
  useAttendanceSocket((newRecord) => {
    setItems((prev) => {
      if (prev.some((a) => a.id === newRecord.id)) return prev;
      return [newRecord, ...prev];
    });
    setLastUpdate(new Date());
  });

  const filtered = items.filter((a) => {
    if (filter === "entry") return a.type === "entry";
    if (filter === "exit") return a.type === "exit";
    if (filter === "late") return a.late_minutes > 30;
    return true;
  });

  const entries = items.filter((a) => a.type === "entry").length;
  const exits = items.filter((a) => a.type === "exit").length;
  const retards = items.filter((a) => a.late_minutes > 30).length;

  return (
    <Layout title="Pointage biométrique">
      <div className="pointage-card">
        <div>
          <h2>📍 Vue d'ensemble des pointages</h2>
          <p>Tous les sites • Mise à jour temps réel {lastUpdate && <span style={{color:"#22c55e",fontWeight:600}}>● {lastUpdate.toLocaleTimeString("fr-FR")}</span>}</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="time">{new Date().toLocaleTimeString("fr-FR")}</div>
          <div style={{ opacity: .7, fontSize: ".85rem" }}>{new Date().toLocaleDateString("fr-FR")}</div>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card green"><div className="kpi-header"><div className="kpi-icon">✅</div></div><div className="kpi-value">{entries}</div><div className="kpi-label">Pointés (entrée)</div></div>
        <div className="kpi-card blue"><div className="kpi-header"><div className="kpi-icon">🚪</div></div><div className="kpi-value">{exits}</div><div className="kpi-label">Pointés (sortie)</div></div>
        <div className="kpi-card orange"><div className="kpi-header"><div className="kpi-icon">⏰</div></div><div className="kpi-value">{retards}</div><div className="kpi-label">Retards</div></div>
        <div className="kpi-card red"><div className="kpi-header"><div className="kpi-icon">📊</div></div><div className="kpi-value">{items.length}</div><div className="kpi-label">Total enregistrements</div></div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <div><div className="panel-title">📋 Journal des pointages — {new Date().toLocaleDateString("fr-FR")}</div></div>
          <div className="panel-actions">
            <div className="filter-bar">
              <button className={`filter-btn ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")}>Tous</button>
              <button className={`filter-btn ${filter === "entry" ? "active" : ""}`} onClick={() => setFilter("entry")}>Entrées</button>
              <button className={`filter-btn ${filter === "exit" ? "active" : ""}`} onClick={() => setFilter("exit")}>Sorties</button>
              <button className={`filter-btn ${filter === "late" ? "active" : ""}`} onClick={() => setFilter("late")}>Retards</button>
            </div>
            <button className="top-btn ghost" onClick={load}>🔄 Actualiser</button>
          </div>
        </div>
        <div className="scroll-x">
          <table className="data-table">
            <thead><tr><th>#</th><th>Ouvrier</th><th>Type</th><th>Heure</th><th>Méthode</th><th>Contrôleur</th><th>Chantier</th><th>Statut</th></tr></thead>
            <tbody>
              {filtered.map((a, i) => (
                <tr key={a.id}>
                  <td>{String(i + 1).padStart(3, "0")}</td>
                  <td>{a.worker_name}</td>
                  <td><span className={`badge ${a.type === "entry" ? "present" : "absent"}`}>{a.type === "entry" ? "🟢 Entrée" : "🔴 Sortie"}</span></td>
                  <td>{formatTime(a.timestamp)}</td>
                  <td>{a.method === "fingerprint" ? "👆 Empreinte" : a.method === "face" ? "👤 Faciale" : "Manuel"}</td>
                  <td>{a.controller_name}</td>
                  <td>{a.site}</td>
                  <td>{a.late_minutes > 0 ? <span className="badge warning">⏰ Retard {a.late_minutes}min</span> : <span className="badge actif">À l'heure</span>}</td>
                </tr>
              ))}
              {!filtered.length && <tr><td colSpan={8} className="empty">Aucun pointage</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
