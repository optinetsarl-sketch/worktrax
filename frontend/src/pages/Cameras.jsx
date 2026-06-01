import Layout from "../components/Layout";
import { SITES } from "../lib/api";

const CAMS = [
  { site: "Lomé-Agoè", zone: "Entrée principale", img: "https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=800" },
  { site: "Lomé-Agoè", zone: "Zone béton", img: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800" },
  { site: "Kégué", zone: "Stock engins", img: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800" },
  { site: "Kégué", zone: "Bâtiment A", img: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800" },
  { site: "Baguida", zone: "Citerne carburant", img: "https://images.unsplash.com/photo-1591608971362-f08b2a75731a?w=800" },
  { site: "Adéwui", zone: "Pelle/Excavatrice", img: "https://images.unsplash.com/photo-1517440822495-577e433eb87b?w=800" },
  { site: "Tsévié", zone: "Sortie", img: "https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=800" },
  { site: "Lomé-Agoè", zone: "Base vie", img: "https://images.unsplash.com/photo-1531834685032-c34bf0d84c77?w=800" },
];

export default function Cameras() {
  const time = new Date().toLocaleTimeString("fr-FR");
  return (
    <Layout title="Caméras IP">
      <div className="rbac-banner" style={{ background: "#dbeafe", color: "#1e40af", borderLeftColor: "#2563a8" }}>
        <span className="rbac-icon">📹</span>
        <div><strong>Surveillance en temps réel</strong> — {CAMS.length} caméras IP réparties sur 5 sites. Mode simulation (placeholders), un capteur réel sera intégré ultérieurement.</div>
      </div>
      <div className="kpi-grid">
        <div className="kpi-card green"><div className="kpi-header"><div className="kpi-icon">🟢</div></div><div className="kpi-value">{CAMS.length}</div><div className="kpi-label">Caméras en ligne</div></div>
        <div className="kpi-card blue"><div className="kpi-header"><div className="kpi-icon">📍</div></div><div className="kpi-value">{SITES.length}</div><div className="kpi-label">Sites surveillés</div></div>
        <div className="kpi-card orange"><div className="kpi-header"><div className="kpi-icon">⚠️</div></div><div className="kpi-value">0</div><div className="kpi-label">Alertes 24h</div></div>
        <div className="kpi-card red"><div className="kpi-header"><div className="kpi-icon">💾</div></div><div className="kpi-value">30j</div><div className="kpi-label">Archivage vidéo</div></div>
      </div>
      <div className="cam-grid">
        {CAMS.map((c, i) => (
          <div key={i} className="cam-tile" data-testid={`cam-${i}`} style={{ backgroundImage: `url(${c.img})`, backgroundSize: "cover", backgroundPosition: "center" }}>
            <div className="cam-noise" />
            <div className="cam-time">📡 {time}</div>
            <div className="cam-tile-label"><span className="cam-live" /> {c.site} — {c.zone}</div>
          </div>
        ))}
      </div>
    </Layout>
  );
}
