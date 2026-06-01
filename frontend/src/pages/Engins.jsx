import { useEffect, useState } from "react";
import http, { formatDate, SITES } from "../lib/api";
import { useAuth } from "../lib/auth";
import Layout from "../components/Layout";

const TRUCK_ICONS = ["🚛", "🚚", "🚜", "🚐", "🚌"];
const MACHINE_ICONS = ["🚜", "⛏", "🏗", "🔧", "⚙️"];

export default function Engins() {
  const { user } = useAuth();
  const [tab, setTab] = useState("trucks");
  const [list, setList] = useState([]);
  const [fuels, setFuels] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const canEdit = user.role === "super_admin" || user.role === "admin" || user.role === "superviseur";

  const load = () => {
    if (tab === "trucks" || tab === "machines") {
      http.get("/equipment", { params: { type: tab === "trucks" ? "truck" : "machine" } }).then((r) => setList(r.data));
    } else {
      http.get("/fuel", { params: { period: "today" } }).then((r) => setFuels(r.data));
      http.get("/equipment").then((r) => setList(r.data));
    }
  };

  useEffect(() => { load(); }, [tab]); // eslint-disable-line

  return (
    <Layout title="Engins">
      {!canEdit && (
        <div className="rbac-banner">
          <span className="rbac-icon">🔒</span>
          <div><strong>Mode consultation</strong> — L'ajout d'engins est réservé à l'<strong>Administrateur</strong> et au <strong>Superviseur</strong>.</div>
        </div>
      )}

      <div className="kpi-grid">
        <div className="kpi-card green"><div className="kpi-header"><div className="kpi-icon">✅</div></div><div className="kpi-value">{list.filter((e) => e.status === "active").length}</div><div className="kpi-label">En service</div></div>
        <div className="kpi-card orange"><div className="kpi-header"><div className="kpi-icon">⚠️</div></div><div className="kpi-value">{list.filter((e) => e.status === "maintenance").length}</div><div className="kpi-label">En maintenance</div></div>
        <div className="kpi-card red"><div className="kpi-header"><div className="kpi-icon">🚫</div></div><div className="kpi-value">{list.filter((e) => e.status === "inactive").length}</div><div className="kpi-label">Hors service</div></div>
        <div className="kpi-card blue"><div className="kpi-header"><div className="kpi-icon">⛽</div></div><div className="kpi-value">{fuels.reduce((s, f) => s + (f.liters || 0), 0)} L</div><div className="kpi-label">Carburant aujourd'hui</div></div>
      </div>

      <div className="fiche-tabs">
        <div className={`fiche-tab ${tab === "trucks" ? "active" : ""}`} onClick={() => setTab("trucks")} data-testid="tab-trucks">🚛 Camions</div>
        <div className={`fiche-tab ${tab === "machines" ? "active" : ""}`} onClick={() => setTab("machines")} data-testid="tab-machines">🚜 Machines</div>
        <div className={`fiche-tab ${tab === "fuel" ? "active" : ""}`} onClick={() => setTab("fuel")} data-testid="tab-fuel">⛽ Carburant & Pompistes</div>
      </div>

      {tab === "trucks" && (
        <div className="panel">
          <div className="panel-header">
            <div><div className="panel-title">🚛 Parc camions</div><div className="panel-subtitle">{list.length} véhicules</div></div>
            {canEdit && (
              <button className="top-btn accent" onClick={() => setShowAdd("truck")}>+ Ajouter camion</button>
            )}
          </div>
          <div className="scroll-x">
            <table className="data-table">
              <thead><tr><th>#</th><th>Type</th><th>Immat.</th><th>Chantier</th><th>Chauffeur</th><th>Carburant/mois</th><th>Dernière visite</th><th>Statut</th></tr></thead>
              <tbody>
                {list.map((e) => (
                  <tr key={e.id}>
                    <td>{e.number}</td>
                    <td>{e.icon} {e.name}</td>
                    <td><strong>{e.plate}</strong></td>
                    <td>{e.site}</td>
                    <td>{e.operator_name || "—"}</td>
                    <td>{e.fuel_month || 0} L</td>
                    <td>{formatDate(e.last_service)}</td>
                    <td><span className={`badge ${statusBadge(e.status)}`}>{statusLabel(e.status)}</span></td>
                  </tr>
                ))}
                {!list.length && <tr><td colSpan={8} className="empty">Aucun camion enregistré</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "machines" && (
        <div className="panel">
          <div className="panel-header">
            <div><div className="panel-title">🚜 Parc machines</div><div className="panel-subtitle">{list.length} engins</div></div>
            {canEdit && (
              <button className="top-btn accent" onClick={() => setShowAdd("machine")}>+ Ajouter machine</button>
            )}
          </div>
          <div className="scroll-x">
            <table className="data-table">
              <thead><tr><th>#</th><th>Machine</th><th>Référence</th><th>Chantier</th><th>Opérateur</th><th>Heures/mois</th><th>Prochain entretien</th><th>Statut</th></tr></thead>
              <tbody>
                {list.map((e) => (
                  <tr key={e.id}>
                    <td>{e.number}</td>
                    <td>{e.icon} {e.name}</td>
                    <td>{e.ref}</td>
                    <td>{e.site}</td>
                    <td>{e.operator_name || "—"}</td>
                    <td>{e.hours_month || 0}h</td>
                    <td>{formatDate(e.next_service)}</td>
                    <td><span className={`badge ${statusBadge(e.status)}`}>{statusLabel(e.status)}</span></td>
                  </tr>
                ))}
                {!list.length && <tr><td colSpan={8} className="empty">Aucune machine enregistrée</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "fuel" && (
        <div className="panel">
          <div className="panel-header"><div><div className="panel-title">⛽ Journal carburant — aujourd'hui</div><div className="panel-subtitle">{fuels.length} distributions • {fuels.reduce((s, f) => s + f.liters, 0)} L total</div></div></div>
          <div className="scroll-x">
            <table className="data-table">
              <thead><tr><th>Heure</th><th>Pompiste</th><th>Engin</th><th>Plaque</th><th>Chauffeur</th><th>Quantité</th><th>Chantier</th></tr></thead>
              <tbody>
                {fuels.map((f) => (
                  <tr key={f.id}>
                    <td>{new Date(f.timestamp).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</td>
                    <td>{f.pompiste_name}</td>
                    <td>{f.equipment_name}</td>
                    <td><strong>{f.plate}</strong></td>
                    <td>{f.chauffeur_name}</td>
                    <td><strong>{f.liters} L</strong></td>
                    <td>{f.site}</td>
                  </tr>
                ))}
                {!fuels.length && <tr><td colSpan={7} className="empty">Aucune distribution aujourd'hui</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showAdd && (
        <AddEquipmentModal
          equipType={showAdd}
          onClose={() => setShowAdd(false)}
          onSaved={() => { setShowAdd(false); load(); }}
        />
      )}
    </Layout>
  );
}

function AddEquipmentModal({ equipType, onClose, onSaved }) {
  const isTruck = equipType === "truck";
  const [form, setForm] = useState({
    type: equipType,
    name: "",
    icon: isTruck ? "🚛" : "🚜",
    plate: "",
    ref: "",
    site: SITES[0] || "",
    operator_name: "",
    fuel_month: 0,
    hours_month: 0,
    status: "active",
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const upd = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      await http.post("/equipment", form);
      onSaved();
    } catch (ex) {
      const d = ex.response?.data?.detail;
      setErr(typeof d === "string" ? d : "Erreur lors de l'enregistrement");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isTruck ? "🚛 Ajouter un camion" : "🚜 Ajouter une machine"}</h2>
          <div className="modal-close" onClick={onClose}>×</div>
        </div>
        <form onSubmit={submit}>
          <div className="form-grid">
            {/* Icône */}
            <div>
              <label className="form-label">Icône</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {(isTruck ? TRUCK_ICONS : MACHINE_ICONS).map((ic) => (
                  <button
                    key={ic}
                    type="button"
                    onClick={() => upd("icon", ic)}
                    style={{
                      fontSize: "1.5rem",
                      padding: "4px 10px",
                      borderRadius: 8,
                      border: form.icon === ic ? "2px solid var(--primary)" : "2px solid #e2e8f0",
                      background: form.icon === ic ? "#eff6ff" : "#f8fafc",
                      cursor: "pointer",
                    }}
                  >{ic}</button>
                ))}
              </div>
            </div>

            {/* Nom */}
            <div>
              <label className="form-label">Nom / Modèle *</label>
              <input
                className="form-input"
                required
                placeholder={isTruck ? "ex: Benne TATA 407" : "ex: Bulldozer CAT D6"}
                value={form.name}
                onChange={(e) => upd("name", e.target.value)}
              />
            </div>

            {/* Immatriculation */}
            <div>
              <label className="form-label">{isTruck ? "Immatriculation *" : "N° Référence *"}</label>
              <input
                className="form-input"
                required
                placeholder={isTruck ? "ex: TG-1234-AA" : "ex: CAT-2023-001"}
                value={form.plate}
                onChange={(e) => upd("plate", e.target.value)}
              />
            </div>

            {/* Réf interne (machines seulement) */}
            {!isTruck && (
              <div>
                <label className="form-label">Référence interne</label>
                <input
                  className="form-input"
                  placeholder="ex: M-045"
                  value={form.ref}
                  onChange={(e) => upd("ref", e.target.value)}
                />
              </div>
            )}

            {/* Chantier */}
            <div>
              <label className="form-label">Chantier *</label>
              <select className="form-input" value={form.site} onChange={(e) => upd("site", e.target.value)}>
                {SITES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>

            {/* Opérateur / Chauffeur */}
            <div>
              <label className="form-label">{isTruck ? "Chauffeur" : "Opérateur"}</label>
              <input
                className="form-input"
                placeholder="Nom complet"
                value={form.operator_name}
                onChange={(e) => upd("operator_name", e.target.value)}
              />
            </div>

            {/* Carburant / Heures */}
            <div>
              <label className="form-label">{isTruck ? "Carburant/mois (L)" : "Heures/mois"}</label>
              <input
                className="form-input"
                type="number"
                min={0}
                value={isTruck ? form.fuel_month : form.hours_month}
                onChange={(e) => upd(isTruck ? "fuel_month" : "hours_month", Number(e.target.value))}
              />
            </div>

            {/* Statut */}
            <div>
              <label className="form-label">Statut initial</label>
              <select className="form-input" value={form.status} onChange={(e) => upd("status", e.target.value)}>
                <option value="active">En service</option>
                <option value="maintenance">En maintenance</option>
                <option value="inactive">Hors service</option>
              </select>
            </div>
          </div>

          {err && <div className="login-error" style={{ marginTop: 12 }}>{err}</div>}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
            <button type="button" className="top-btn ghost" onClick={onClose}>Annuler</button>
            <button type="submit" className="top-btn accent" disabled={busy || !form.name || !form.plate}>
              {busy ? "Enregistrement…" : `✓ Enregistrer ${isTruck ? "le camion" : "la machine"}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function statusBadge(s) {
  return { active: "actif", maintenance: "maintenance", inactive: "inactif" }[s] || "actif";
}
function statusLabel(s) {
  return { active: "● En service", maintenance: "⚠ Maintenance", inactive: "● Hors service" }[s] || s;
}
