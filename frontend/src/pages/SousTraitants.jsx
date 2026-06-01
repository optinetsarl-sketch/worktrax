import { useEffect, useMemo, useState } from "react";
import http from "../lib/api";
import Layout from "../components/Layout";

export default function SousTraitants() {
  const [data, setData] = useState(null);
  const [selected, setSelected] = useState("");

  useEffect(() => {
    http.get("/structures/overview").then((r) => {
      setData(r.data);
      if (r.data?.structures?.length) setSelected(r.data.structures[0].name);
    });
  }, []);

  const structures = useMemo(() => data?.structures || [], [data?.structures]);
  const selectedStructure = useMemo(
    () => structures.find((item) => item.name === selected) || structures[0],
    [structures, selected]
  );

  if (!data) {
    return <Layout title="Sous-traitants"><div>Chargement…</div></Layout>;
  }

  return (
    <Layout title="Sous-traitants">
      <div className="kpi-grid">
        <div className="kpi-card blue">
          <div className="kpi-header"><div className="kpi-icon">🏢</div></div>
          <div className="kpi-value">{data.total_structures}</div>
          <div className="kpi-label">Structures actives</div>
        </div>
        <div className="kpi-card green">
          <div className="kpi-header"><div className="kpi-icon">✅</div></div>
          <div className="kpi-value">{data.total_present}</div>
          <div className="kpi-label">Ouvriers présents</div>
          <div className="kpi-sub">Sur {data.total_workers} ouvriers</div>
        </div>
        <div className="kpi-card red">
          <div className="kpi-header"><div className="kpi-icon">⛔</div></div>
          <div className="kpi-value">{data.total_absent}</div>
          <div className="kpi-label">Ouvriers absents</div>
        </div>
        <div className="kpi-card orange">
          <div className="kpi-header"><div className="kpi-icon">⏱️</div></div>
          <div className="kpi-value">{(data.total_hours_month || 0).toLocaleString("fr-FR")}h</div>
          <div className="kpi-label">Heures cumulées / mois</div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <div>
            <div className="panel-title">🏢 Cabinets et sous-traitants</div>
            <div className="panel-subtitle">Répartition des ouvriers par structure</div>
          </div>
        </div>
        <div className="scroll-x">
          <table className="data-table">
            <thead>
              <tr>
                <th>Structure</th>
                <th>Ouvriers</th>
                <th>Présents</th>
                <th>Absents</th>
                <th>Taux présence</th>
                <th>Heures/mois</th>
                <th>Sites couverts</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {structures.map((item) => (
                <tr key={item.name}>
                  <td><strong>{item.name}</strong></td>
                  <td>{item.total_workers}</td>
                  <td><span className="badge actif">{item.present_workers}</span></td>
                  <td><span className="badge absent">{item.absent_workers}</span></td>
                  <td>{item.presence_rate}%</td>
                  <td>{(item.hours_month || 0).toLocaleString("fr-FR")}h</td>
                  <td>{item.sites?.length || 0}</td>
                  <td>
                    <button
                      className="top-btn ghost"
                      style={{ padding: "5px 10px", fontSize: ".75rem" }}
                      onClick={() => setSelected(item.name)}
                    >
                      Voir détail
                    </button>
                  </td>
                </tr>
              ))}
              {!structures.length && <tr><td colSpan={8} className="empty">Aucune structure trouvée</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <div>
            <div className="panel-title">📍 Ouvriers par site — {selectedStructure?.name || "—"}</div>
            <div className="panel-subtitle">Détail par chantier</div>
          </div>
        </div>
        <div className="scroll-x">
          <table className="data-table">
            <thead>
              <tr>
                <th>Site</th>
                <th>Ouvriers</th>
                <th>Présents</th>
                <th>Absents</th>
                <th>Heures/mois</th>
              </tr>
            </thead>
            <tbody>
              {(selectedStructure?.sites || []).map((site) => (
                <tr key={`${selectedStructure.name}-${site.site}`}>
                  <td>{site.site}</td>
                  <td>{site.workers}</td>
                  <td><span className="badge actif">{site.present}</span></td>
                  <td><span className="badge absent">{site.absent}</span></td>
                  <td>{(site.hours_month || 0).toLocaleString("fr-FR")}h</td>
                </tr>
              ))}
              {!(selectedStructure?.sites || []).length && <tr><td colSpan={5} className="empty">Aucun site disponible</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
