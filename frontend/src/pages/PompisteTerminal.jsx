import { useEffect, useState } from "react";
import http, { SITES, formatTime } from "../lib/api";
import Layout from "../components/Layout";

const QTY_PRESETS = [20, 40, 60, 80, 100, 120];

export default function PompisteTerminal() {
  const [equipment, setEquipment] = useState([]);
  const [plate, setPlate] = useState("");
  const [matched, setMatched] = useState(null);
  const [chauffeur, setChauffeur] = useState("");
  const [site, setSite] = useState(SITES[0]);
  const [qty, setQty] = useState(0);
  const [bioChauf, setBioChauf] = useState(false);
  const [bioPomp, setBioPomp] = useState(false);
  const [stats, setStats] = useState({});
  const [distribs, setDistribs] = useState([]);
  const [msg, setMsg] = useState("");

  const load = () => {
    http.get("/equipment").then((r) => setEquipment(r.data));
    http.get("/dashboard/pompiste").then((r) => {
      setStats(r.data);
      setDistribs(r.data.distributions);
    });
  };
  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!plate || plate.length < 4) {
      setMatched(null);
      return;
    }
    const found = equipment.find((e) => e.plate.toUpperCase() === plate.trim().toUpperCase());
    if (found) {
      setMatched(found);
      setChauffeur(found.operator_name || "");
      setSite(found.site);
    } else {
      setMatched(null);
    }
  }, [plate, equipment]);

  const submit = async () => {
    if (!matched || !qty || !bioChauf || !bioPomp) {
      setMsg("⚠️ Complétez toutes les étapes");
      return;
    }
    setMsg("");
    try {
      await http.post("/fuel", {
        equipment_id: matched.id,
        plate: matched.plate,
        liters: parseInt(qty),
        chauffeur_name: chauffeur || matched.operator_name,
        site,
      });
      setMsg("✅ Distribution enregistrée !");
      setPlate("");
      setMatched(null);
      setChauffeur("");
      setQty(0);
      setBioChauf(false);
      setBioPomp(false);
      load();
      setTimeout(() => setMsg(""), 3000);
    } catch (e) {
      setMsg("❌ " + (e.response?.data?.detail || "Erreur"));
    }
  };

  const suggestions = plate.length >= 2
    ? equipment.filter((e) => e.plate.toUpperCase().includes(plate.toUpperCase())).slice(0, 5)
    : [];

  return (
    <Layout title="Terminal Pompiste">
      <div className="role-banner pompiste">
        <div className="rb-icon">⛽</div>
        <div>
          <h2>Terminal Pompiste — Distribution carburant</h2>
          <p>Double validation biométrique pour chaque distribution</p>
        </div>
        <div className="rb-right">
          <div className="rb-time">{new Date().toLocaleTimeString("fr-FR")}</div>
          <div style={{ opacity: .7, fontSize: ".78rem" }}>{new Date().toLocaleDateString("fr-FR")}</div>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card orange"><div className="kpi-header"><div className="kpi-icon">⛽</div></div><div className="kpi-value">{stats.today_liters || 0} L</div><div className="kpi-label">Distribués aujourd'hui</div></div>
        <div className="kpi-card green"><div className="kpi-header"><div className="kpi-icon">🚛</div></div><div className="kpi-value">{stats.today_engins || 0}</div><div className="kpi-label">Engins ravitaillés</div></div>
        <div className="kpi-card blue"><div className="kpi-header"><div className="kpi-icon">💧</div></div><div className="kpi-value">{(stats.stock_total || 0).toLocaleString("fr-FR")} L</div><div className="kpi-label">Stock citerne</div></div>
        <div className="kpi-card red"><div className="kpi-header"><div className="kpi-icon">📊</div></div><div className="kpi-value">{stats.today_count || 0}</div><div className="kpi-label">Distributions du jour</div></div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          <div className="fuel-form">
            <h3>🔢 Étape 1 — Identifier l'engin</h3>
            <label className="form-label">Plaque d'immatriculation</label>
            <div style={{ position: "relative" }}>
              <input
                className="plate-input"
                value={plate}
                onChange={(e) => setPlate(e.target.value)}
                placeholder="TG-2024-001..."
                data-testid="plate-input"
              />
              {suggestions.length > 0 && !matched && (
                <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, marginTop: 4, maxHeight: 200, overflow: "auto", zIndex: 10, boxShadow: "var(--shadow-lg)" }}>
                  {suggestions.map((s) => (
                    <div key={s.id} style={{ padding: "8px 12px", cursor: "pointer", fontSize: ".85rem" }} onClick={() => setPlate(s.plate)}>
                      <strong>{s.plate}</strong> — {s.icon} {s.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {matched && (
              <div style={{ marginTop: 8, padding: 10, background: "#dcfce7", borderRadius: 8, fontSize: ".82rem" }} data-testid="matched-equipment">
                ✅ <strong>{matched.icon} {matched.name}</strong> — {matched.site} • Chauffeur: {matched.operator_name || "—"}
              </div>
            )}
            <div className="form-grid" style={{ marginTop: 12 }}>
              <div><label className="form-label">Chauffeur</label><input className="form-input" value={chauffeur} onChange={(e) => setChauffeur(e.target.value)} /></div>
              <div><label className="form-label">Chantier</label>
                <select className="form-input" value={site} onChange={(e) => setSite(e.target.value)}>
                  {SITES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="fuel-form">
            <h3>⚖️ Étape 2 — Quantité</h3>
            <div className="fuel-qty-display">
              <div className="qty-num">{qty || 0}</div>
              <div className="qty-unit">litres de gazole</div>
            </div>
            <div className="qty-btn-row">
              {QTY_PRESETS.map((q) => (
                <div key={q} className={`qty-preset ${qty == q ? "selected" : ""}`} onClick={() => setQty(q)} data-testid={`preset-${q}`}>{q} L</div>
              ))}
            </div>
            <label className="form-label">Quantité personnalisée</label>
            <input className="form-input" type="number" value={qty} onChange={(e) => setQty(e.target.value)} placeholder="Ex: 75" data-testid="qty-input" />
          </div>
        </div>

        <div>
          <div className="fuel-validation">
            <span className="fuel-scan-icon">👆</span>
            <h3>Étape 3 — Double validation biométrique</h3>
            <p style={{ opacity: .8, fontSize: ".82rem" }}>Le chauffeur puis le pompiste confirment chacun par empreinte</p>

            <div style={{ background: "rgba(255,255,255,.08)", borderRadius: 10, padding: 14, margin: "14px 0", textAlign: "left", fontSize: ".82rem" }}>
              <div style={{ marginBottom: 4 }}>🚛 <strong style={{ color: "#fcd34d" }}>{matched?.plate || "—"}</strong></div>
              <div style={{ marginBottom: 4 }}>👤 {chauffeur || "—"}</div>
              <div style={{ marginBottom: 4 }}>⛽ <strong style={{ color: "#fcd34d" }}>{qty || 0} L</strong></div>
              <div>📍 {site}</div>
            </div>

            <div className="bio-steps">
              <div className={`bio-step ${bioChauf ? "done" : ""}`} data-testid="bio-chauf">
                <div className="bio-step-icon">🚗</div>
                <div className="bio-step-body">
                  <div className="bs-label">3a — Chauffeur</div>
                  <div className="bs-name">{chauffeur || "—"}</div>
                  <div className="bs-status">{bioChauf ? "✓ Validé" : "En attente..."}</div>
                </div>
                <div style={{ fontSize: "1.4rem" }}>{bioChauf ? "✅" : "⭕"}</div>
              </div>
              <div className={`bio-step ${bioPomp ? "done" : ""}`} data-testid="bio-pomp">
                <div className="bio-step-icon">⛽</div>
                <div className="bio-step-body">
                  <div className="bs-label">3b — Pompiste (moi)</div>
                  <div className="bs-name">Moi</div>
                  <div className="bs-status">{bioPomp ? "✓ Validé" : "En attente..."}</div>
                </div>
                <div style={{ fontSize: "1.4rem" }}>{bioPomp ? "✅" : "⭕"}</div>
              </div>
            </div>

            <button className="top-btn ghost" style={{ width: "100%", marginBottom: 6, background: "rgba(255,255,255,.1)", color: "#fff", borderColor: "rgba(255,255,255,.3)" }} onClick={() => setBioChauf(true)} disabled={!matched || bioChauf} data-testid="btn-bio-chauf">🚗 👆 Empreinte chauffeur</button>
            <button className="top-btn ghost" style={{ width: "100%", marginBottom: 6, background: "rgba(255,255,255,.1)", color: "#fff", borderColor: "rgba(255,255,255,.3)" }} onClick={() => setBioPomp(true)} disabled={!bioChauf || bioPomp} data-testid="btn-bio-pomp">⛽ 👆 Empreinte pompiste</button>
            <button className="fuel-validate-btn" disabled={!matched || !qty || !bioChauf || !bioPomp} onClick={submit} data-testid="btn-submit-fuel">✅ Confirmer et enregistrer</button>
            {msg && <div style={{ marginTop: 10, padding: 10, background: "rgba(255,255,255,.1)", borderRadius: 8 }}>{msg}</div>}
          </div>
        </div>
      </div>

      <div className="panel" style={{ marginTop: 18 }}>
        <div className="panel-header"><div><div className="panel-title">📋 Distributions du jour</div><div className="panel-subtitle">{distribs.length} enregistrées</div></div></div>
        <div className="scroll-x">
          <table className="data-table">
            <thead><tr><th>Heure</th><th>Engin</th><th>Plaque</th><th>Chauffeur</th><th>Quantité</th><th>Chantier</th></tr></thead>
            <tbody>
              {distribs.map((d) => (
                <tr key={d.id}>
                  <td>{formatTime(d.timestamp)}</td>
                  <td>{d.equipment_name}</td>
                  <td><strong>{d.plate}</strong></td>
                  <td>{d.chauffeur_name}</td>
                  <td><strong>{d.liters} L</strong></td>
                  <td>{d.site}</td>
                </tr>
              ))}
              {!distribs.length && <tr><td colSpan={6} className="empty">Aucune distribution</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
