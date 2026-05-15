import { useMemo, useState } from 'react';
import { engineLookup } from '../data/engines.js';
import { KpiCard } from '../components/ui/KpiCard.jsx';
import { Panel } from '../components/ui/Panel.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Table } from '../components/ui/Table.jsx';
import { useClock } from '../hooks/useClock.js';

export function PompisteTerminalPage() {
  const { time, shortDate } = useClock();
  const [plate, setPlate] = useState('');
  const [qty, setQty] = useState(0);
  const [driverOk, setDriverOk] = useState(false);
  const [pumpOk, setPumpOk] = useState(false);
  const [distributions, setDistributions] = useState([
    { time: '08:02', engine: 'Camion benne', plate: 'TG-2024-001', driver: 'TEST', qty: 50, site: 'Lomé-Agoè' },
    { time: '08:03', engine: 'Camion benne', plate: 'TG-2024-001', driver: 'Koffi Mensah', qty: 100, site: 'Lomé-Agoè' },
  ]);
  const engine = engineLookup[plate];
  const total = distributions.reduce((sum, item) => sum + item.qty, 0);
  const canConfirm = engine && qty > 0 && driverOk && pumpOk;
  const suggestions = useMemo(() => Object.keys(engineLookup).filter((key) => key.includes(plate.toUpperCase()) && plate.length > 1).slice(0, 5), [plate]);

  const confirm = () => {
    if (!canConfirm) return;
    setDistributions([{ time: time.slice(0, 5), engine: engine.type, plate, driver: engine.driver, qty, site: engine.site }, ...distributions]);
    setPlate(''); setQty(0); setDriverOk(false); setPumpOk(false);
  };

  return (
    <div className="stack">
      <div className="role-hero pompiste"><span>⛽</span><div><h2>Terminal Pompiste — Distribution carburant</h2><p>Double validation biométrique pour chaque distribution</p></div><strong>{time}<small>{shortDate}</small></strong></div>
      <div className="kpi-grid"><KpiCard icon="⛽" value={`${total} L`} label="Distribués aujourd'hui" tone="orange" /><KpiCard icon="🚛" value="1" label="Engins ravitaillés" tone="green" /><KpiCard icon="💧" value="12 400 L" label="Stock citerne" tone="blue" /><KpiCard icon="📊" value={distributions.length} label="Distributions du jour" tone="red" /></div>
      <div className="grid-2">
        <div className="stack">
          <Panel title="🔢 Étape 1 — Identifier l'engin"><label className="field">Plaque d'immatriculation<input value={plate} onChange={(event) => setPlate(event.target.value.toUpperCase())} placeholder="TG-2024-001..." /></label>{suggestions.length ? <div className="suggestions">{suggestions.map((item) => <button key={item} onClick={() => setPlate(item)}>{item} — {engineLookup[item].type}</button>)}</div> : null}{engine ? <div className="success-box">✅ {engine.type} — {engine.site} • Chauffeur: {engine.driver}</div> : plate ? <div className="error-box">🚫 Engin non enregistré — Service refusé</div> : null}<div className="form-grid"><label>Chauffeur<input value={engine?.driver || ''} readOnly /></label><label>Chantier<select value={engine?.site || 'Lomé-Agoè'} readOnly><option>Lomé-Agoè</option><option>Kégué</option><option>Baguida</option><option>Adéwui</option></select></label></div></Panel>
          <Panel title="⚖️ Étape 2 — Quantité"><div className="qty-display"><strong>{qty}</strong><span>litres de gazole</span></div><div className="qty-grid">{[20, 40, 60, 80, 100, 120].map((value) => <button key={value} className={qty === value ? 'selected' : ''} onClick={() => setQty(value)}>{value} L</button>)}</div><label className="field">Quantité personnalisée<input type="number" value={qty} onChange={(event) => setQty(Number(event.target.value))} /></label></Panel>
        </div>
        <Panel className="bio-panel"><div className="bio-main">👆<h2>Étape 3 — Double validation biométrique</h2><p>Le chauffeur puis le pompiste confirment chacun par empreinte</p></div><div className="transaction"><p>🚛 <strong>{plate || '—'}</strong></p><p>👤 {engine?.driver || '—'}</p><p>⛽ <strong>{qty} L</strong></p><p>📍 {engine?.site || 'Lomé-Agoè'}</p></div><BioStep label="3A — Chauffeur" name={engine?.driver || '—'} done={driverOk} onClick={() => engine && qty > 0 && setDriverOk(true)} /><BioStep label="3B — Pompiste (moi)" name="Moi" done={pumpOk} disabled={!driverOk} onClick={() => driverOk && setPumpOk(true)} /><Button variant="accent" disabled={!canConfirm} onClick={confirm}>✅ Confirmer et enregistrer</Button></Panel>
      </div>
      <Panel title="📋 Distributions du jour" subtitle={`${distributions.length} enregistrées`}><Table columns={['Heure', 'Engin', 'Plaque', 'Chauffeur', 'Quantité', 'Chantier']}>{distributions.map((item) => <tr key={`${item.time}-${item.qty}`}><td>{item.time}</td><td>{item.engine}</td><td>{item.plate}</td><td>{item.driver}</td><td>{item.qty} L</td><td>{item.site}</td></tr>)}</Table></Panel>
    </div>
  );
}
function BioStep({ label, name, done, disabled, onClick }) { return <button className={`bio-step ${done ? 'done' : ''}`} disabled={disabled} onClick={onClick}><span>{done ? '✅' : '⭕'}</span><strong>{label}</strong><em>{name}</em></button>; }
