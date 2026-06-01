import { useEffect, useMemo, useState } from "react";
import http, { formatDateTime, formatDistanceKm } from "../lib/api";
import Layout from "../components/Layout";

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function MiniMap({ siteCoords, lastPosition, path }) {
  if (!siteCoords) {
    return <div className="empty" style={{ padding: 20 }}>Aucune coordonnée chantier.</div>;
  }
  const maxLatDelta = 0.02;
  const maxLngDelta = 0.02;
  const toPercent = (lat, lng) => {
    const top = 50 - ((lat - siteCoords.lat) / maxLatDelta) * 50;
    const left = 50 + ((lng - siteCoords.lng) / maxLngDelta) * 50;
    return {
      top: clamp(top, 2, 98),
      left: clamp(left, 2, 98),
    };
  };
  const points = (path || []).map((p) => ({ ...p, ...toPercent(p.latitude, p.longitude) }));
  const sitePoint = { top: 50, left: 50 };
  const lastPoint = lastPosition ? toPercent(lastPosition.latitude, lastPosition.longitude) : null;

  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: 12, padding: 12 }}>
      <div style={{ fontSize: ".8rem", marginBottom: 8, color: "var(--text-muted)" }}>
        Site ({siteCoords.lat}, {siteCoords.lng})
      </div>
      <div style={{ position: "relative", height: 220, borderRadius: 10, background: "linear-gradient(180deg,#eff6ff,#dbeafe)" }}>
        {points.map((p, i) => (
          <div
            key={`${p.timestamp}-${i}`}
            title={`${formatDateTime(p.timestamp)} • ${p.worker_name || "—"}`}
            style={{
              position: "absolute",
              top: `${p.top}%`,
              left: `${p.left}%`,
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#0f766e",
              transform: "translate(-50%,-50%)",
              boxShadow: "0 0 0 2px rgba(255,255,255,.8)",
            }}
          />
        ))}
        <div
          title="Site assigné"
          style={{
            position: "absolute",
            top: `${sitePoint.top}%`,
            left: `${sitePoint.left}%`,
            width: 12,
            height: 12,
            borderRadius: "50%",
            background: "#f97316",
            transform: "translate(-50%,-50%)",
            boxShadow: "0 0 0 2px rgba(255,255,255,.9)",
          }}
        />
        {lastPoint && (
          <div
            title="Dernière position"
            style={{
              position: "absolute",
              top: `${lastPoint.top}%`,
              left: `${lastPoint.left}%`,
              width: 14,
              height: 14,
              borderRadius: "50%",
              border: "3px solid #16a34a",
              background: "#dcfce7",
              transform: "translate(-50%,-50%)",
            }}
          />
        )}
      </div>
    </div>
  );
}

export default function SuperviseurControleurs() {
  const [site, setSite] = useState("");
  const [data, setData] = useState(null);
  const [selectedId, setSelectedId] = useState("");

  useEffect(() => {
    http.get("/controllers/sites", { params: site ? { site } : {} }).then((r) => {
      setData(r.data);
      const first = r.data?.items?.[0]?.controller?.id;
      setSelectedId((prev) => prev || first || "");
    });
  }, [site]);

  const items = useMemo(() => data?.items || [], [data?.items]);
  const selected = useMemo(
    () => items.find((item) => item.controller.id === selectedId) || items[0],
    [items, selectedId]
  );

  if (!data) return <Layout title="Contrôleurs sur sites"><div>Chargement…</div></Layout>;

  const positionedCount = items.filter((item) => !!item.last_position).length;
  const totalScans = items.reduce((sum, item) => sum + (item.today_scans_count || 0), 0);

  return (
    <Layout title="Contrôleurs sur sites">
      <div className="kpi-grid">
        <div className="kpi-card blue">
          <div className="kpi-header"><div className="kpi-icon">📱</div></div>
          <div className="kpi-value">{data.controllers_count}</div>
          <div className="kpi-label">Contrôleurs affectés</div>
        </div>
        <div className="kpi-card green">
          <div className="kpi-header"><div className="kpi-icon">📍</div></div>
          <div className="kpi-value">{positionedCount}</div>
          <div className="kpi-label">Positions GPS disponibles</div>
        </div>
        <div className="kpi-card orange">
          <div className="kpi-header"><div className="kpi-icon">🧭</div></div>
          <div className="kpi-value">{totalScans}</div>
          <div className="kpi-label">Scans du jour</div>
        </div>
        <div className="kpi-card red">
          <div className="kpi-header"><div className="kpi-icon">🏗️</div></div>
          <div className="kpi-value">{data.site || "Tous"}</div>
          <div className="kpi-label">Site filtré</div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <div>
            <div className="panel-title">Sélection du chantier</div>
            <div className="panel-subtitle">Filtrer les contrôleurs par site assigné</div>
          </div>
          <select className="form-input" style={{ width: 260 }} value={site} onChange={(e) => setSite(e.target.value)}>
            <option value="">Tous les sites</option>
            {(data.sites_available || []).map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="grid-2">
        <div className="panel">
          <div className="panel-header">
            <div>
              <div className="panel-title">Contrôleurs affectés</div>
              <div className="panel-subtitle">{items.length} résultat(s)</div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {items.map((item) => {
              const isActive = selected?.controller?.id === item.controller.id;
              return (
                <div
                  key={item.controller.id}
                  onClick={() => setSelectedId(item.controller.id)}
                  style={{
                    border: `1.5px solid ${isActive ? "var(--primary-light)" : "var(--border)"}`,
                    borderRadius: 10,
                    padding: 12,
                    cursor: "pointer",
                    background: isActive ? "#eff6ff" : "#fff",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <strong>{item.controller.name}</strong>
                    <span className="badge actif">{item.today_scans_count} scan(s)</span>
                  </div>
                  <div className="muted" style={{ fontSize: ".76rem", marginTop: 2 }}>{item.controller.email}</div>
                  <div style={{ marginTop: 6, fontSize: ".78rem" }}>
                    📍 {item.assigned_site || "—"} • Distance: {formatDistanceKm(item.distance_to_site_km)}
                  </div>
                </div>
              );
            })}
            {!items.length && <div className="empty">Aucun contrôleur trouvé.</div>}
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <div className="panel-title">Position et trajet du jour</div>
              <div className="panel-subtitle">{selected?.controller?.name || "—"}</div>
            </div>
          </div>
          {selected ? (
            <>
              <div style={{ marginBottom: 10, fontSize: ".82rem" }}>
                <strong>Dernière position :</strong>{" "}
                {selected.last_position
                  ? `${selected.last_position.latitude}, ${selected.last_position.longitude} (${formatDateTime(selected.last_position.timestamp)})`
                  : "Aucune position enregistrée"}
              </div>
              <MiniMap
                siteCoords={selected.site_coords}
                lastPosition={selected.last_position}
                path={selected.path}
              />
              <div className="scroll-x" style={{ marginTop: 12 }}>
                <table className="data-table">
                  <thead><tr><th>Heure</th><th>Ouvrier</th><th>Type</th><th>Lat</th><th>Lng</th></tr></thead>
                  <tbody>
                    {(selected.path || []).slice().reverse().map((p, idx) => (
                      <tr key={`${p.timestamp}-${idx}`}>
                        <td>{formatDateTime(p.timestamp)}</td>
                        <td>{p.worker_name || "—"}</td>
                        <td>{p.type || "—"}</td>
                        <td>{p.latitude}</td>
                        <td>{p.longitude}</td>
                      </tr>
                    ))}
                    {!(selected.path || []).length && <tr><td colSpan={5} className="empty">Aucun trajet GPS du jour</td></tr>}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="empty">Sélectionnez un contrôleur.</div>
          )}
        </div>
      </div>
    </Layout>
  );
}
