import { KpiCard } from '../components/ui/KpiCard.jsx';

const cams = ['Lomé-Agoè — Entrée principale', 'Lomé-Agoè — Zone béton', 'Kégué — Stock engins', 'Kégué — Bâtiment A', 'Baguida — Citerne carburant', 'Adéwui — Pelle/Excavatrice', 'Tsévié — Sortie', 'Lomé-Agoè — Base vie'];
export function CamerasPage() {
  return <div className="stack"><div className="info-banner">📹 Surveillance en temps réel — 8 caméras IP réparties sur 5 sites. Mode simulation.</div><div className="kpi-grid"><KpiCard icon="🟢" value="8" label="Caméras en ligne" tone="green" /><KpiCard icon="📍" value="5" label="Sites surveillés" tone="blue" /><KpiCard icon="⚠️" value="0" label="Alertes 24h" tone="orange" /><KpiCard icon="💾" value="30j" label="Archivage vidéo" tone="red" /></div><div className="camera-grid">{cams.map((cam, index) => <div className="camera-card" key={cam} style={{ backgroundImage: `linear-gradient(rgba(0,0,0,.1), rgba(0,0,0,.6)), url(https://picsum.photos/seed/worktrax-${index}/640/360)` }}><strong>🔴 {cam}</strong><span>📡 14:32:48</span></div>)}</div></div>;
}
