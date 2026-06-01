import { useEffect, useState } from "react";
import http, { formatDate } from "../lib/api";
import Layout from "../components/Layout";

const TYPE_LABEL = {
  conge_paye: "🌴 Congé payé",
  maladie: "🏥 Maladie",
  accident_travail: "🩹 Accident travail",
  injustifiee: "❓ Injustifiée",
};

export default function Absences() {
  const [list, setList] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [filter, setFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const load = () => {
    http.get("/absences").then((r) => setList(r.data));
    http.get("/workers").then((r) => setWorkers(r.data));
  };
  useEffect(() => { load(); }, []);
  const filtered = list.filter((a) => filter === "all" || a.type === filter);
  return (
    <Layout title="Absences & Congés">
      <div className="kpi-grid">
        <div className="kpi-card purple"><div className="kpi-header"><div className="kpi-icon">🌴</div></div><div className="kpi-value">{list.filter((a) => a.type === "conge_paye").length}</div><div className="kpi-label">Congés</div></div>
        <div className="kpi-card orange"><div className="kpi-header"><div className="kpi-icon">🏥</div></div><div className="kpi-value">{list.filter((a) => a.type === "maladie").length}</div><div className="kpi-label">Maladies</div></div>
        <div className="kpi-card red"><div className="kpi-header"><div className="kpi-icon">🩹</div></div><div className="kpi-value">{list.filter((a) => a.type === "accident_travail").length}</div><div className="kpi-label">Accidents</div></div>
        <div className="kpi-card blue"><div className="kpi-header"><div className="kpi-icon">❓</div></div><div className="kpi-value">{list.filter((a) => a.type === "injustifiee").length}</div><div className="kpi-label">Injustifiées</div></div>
      </div>
      <div className="panel">
        <div className="panel-header">
          <div><div className="panel-title">📋 Toutes les absences</div></div>
          <div className="panel-actions">
            <div className="filter-bar">
              <button className={`filter-btn ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")}>Tous</button>
              <button className={`filter-btn ${filter === "conge_paye" ? "active" : ""}`} onClick={() => setFilter("conge_paye")}>Congés</button>
              <button className={`filter-btn ${filter === "maladie" ? "active" : ""}`} onClick={() => setFilter("maladie")}>Maladie</button>
              <button className={`filter-btn ${filter === "accident_travail" ? "active" : ""}`} onClick={() => setFilter("accident_travail")}>Accident</button>
              <button className={`filter-btn ${filter === "injustifiee" ? "active" : ""}`} onClick={() => setFilter("injustifiee")}>Injustifiée</button>
            </div>
            <button className="top-btn accent" onClick={() => setShowAdd(true)} data-testid="add-absence-btn">+ Nouvelle absence</button>
          </div>
        </div>
        <div className="scroll-x">
          <table className="data-table">
            <thead><tr><th>Ouvrier</th><th>Catégorie</th><th>Type</th><th>Du</th><th>Au</th><th>Jours</th><th>Déclaré par</th><th>Justificatif</th><th>Statut</th></tr></thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id}>
                  <td>{a.worker_name}</td>
                  <td>{a.worker_category}</td>
                  <td>{TYPE_LABEL[a.type] || a.type}</td>
                  <td>{formatDate(a.date_from)}</td>
                  <td>{formatDate(a.date_to)}</td>
                  <td>{a.days}</td>
                  <td style={{ fontSize: ".78rem" }}>
                    <strong>{a.declared_by_name || "—"}</strong>
                    <div className="muted" style={{ fontSize: ".72rem" }}>{a.declared_by_role || "—"}</div>
                  </td>
                  <td><span className={`badge ${a.justificatif ? "actif" : "absent"}`}>{a.justificatif ? "✓ Joint" : "✗ Absent"}</span></td>
                  <td><span className={`badge ${a.statut === "valide" ? "actif" : a.statut === "en_cours" ? "warning" : "absent"}`}>{a.statut}</span></td>
                </tr>
              ))}
              {!filtered.length && <tr><td colSpan={9} className="empty">Aucune absence</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      {showAdd && <AddModal workers={workers} onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); load(); }} />}
    </Layout>
  );
}

function AddModal({ workers, onClose, onSaved }) {
  const [form, setForm] = useState({
    worker_id: workers[0]?.id || "",
    type: "conge_paye",
    date_from: new Date().toISOString().slice(0, 10),
    date_to: new Date().toISOString().slice(0, 10),
    days: 1,
  });
  const upd = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const submit = async (e) => {
    e.preventDefault();
    await http.post("/absences", form);
    onSaved();
  };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header"><h2>+ Nouvelle absence</h2><div className="modal-close" onClick={onClose}>×</div></div>
        <form onSubmit={submit}>
          <div className="form-grid">
            <div><label className="form-label">Ouvrier</label>
              <select className="form-input" value={form.worker_id} onChange={(e) => upd("worker_id", e.target.value)} required>
                {workers.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
            <div><label className="form-label">Type</label>
              <select className="form-input" value={form.type} onChange={(e) => upd("type", e.target.value)}>
                <option value="conge_paye">Congé payé</option>
                <option value="maladie">Maladie</option>
                <option value="accident_travail">Accident travail</option>
                <option value="injustifiee">Injustifiée</option>
              </select>
            </div>
            <div><label className="form-label">Du</label><input className="form-input" type="date" value={form.date_from} onChange={(e) => upd("date_from", e.target.value)} /></div>
            <div><label className="form-label">Au</label><input className="form-input" type="date" value={form.date_to} onChange={(e) => upd("date_to", e.target.value)} /></div>
            <div><label className="form-label">Jours</label><input className="form-input" type="number" min="1" value={form.days} onChange={(e) => upd("days", parseInt(e.target.value))} /></div>
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 18 }}>
            <button type="button" className="top-btn ghost" onClick={onClose}>Annuler</button>
            <button type="submit" className="top-btn accent">✓ Enregistrer</button>
          </div>
        </form>
      </div>
    </div>
  );
}
