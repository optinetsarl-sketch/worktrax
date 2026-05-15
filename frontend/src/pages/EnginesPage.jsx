import { useState } from 'react';
import { trucks, machines, fuelLog } from '../data/engines.js';
import { KpiCard } from '../components/ui/KpiCard.jsx';
import { Panel } from '../components/ui/Panel.jsx';
import { Table } from '../components/ui/Table.jsx';
import { Badge } from '../components/ui/Badge.jsx';

export function EnginesPage({ initialTab = 'trucks' }) {
  const [tab, setTab] = useState(initialTab);
  const serviceCount = tab === 'machines' ? 13 : tab === 'fuel' ? 23 : 10;
  return (
    <div className="stack">
      <div className="kpi-grid"><KpiCard icon="✅" value={serviceCount} label="En service" tone="green" /><KpiCard icon="⚠️" value={tab === 'machines' ? 2 : 1} label="En maintenance" tone="orange" /><KpiCard icon="🚫" value={tab === 'fuel' ? 2 : 1} label="Hors service" tone="red" /><KpiCard icon="⛽" value={tab === 'fuel' ? '1100 L' : '0 L'} label="Carburant aujourd'hui" tone="blue" /></div>
      <div className="tabs page-tabs"><button className={tab === 'trucks' ? 'active' : ''} onClick={() => setTab('trucks')}>🚛 Camions</button><button className={tab === 'machines' ? 'active' : ''} onClick={() => setTab('machines')}>🚜 Machines</button><button className={tab === 'fuel' ? 'active' : ''} onClick={() => setTab('fuel')}>⛽ Carburant & Pompistes</button></div>
      {tab === 'trucks' ? <Trucks /> : null}
      {tab === 'machines' ? <Machines /> : null}
      {tab === 'fuel' ? <FuelJournal /> : null}
    </div>
  );
}
function statusTone(status) { return status === 'service' ? 'present' : status === 'maintenance' ? 'maintenance' : 'neutral'; }
function statusLabel(status) { return status === 'service' ? '● En service' : status === 'maintenance' ? '⚠ Maintenance' : '● Hors service'; }
function Trucks() { return <Panel title="🚛 Parc camions" subtitle="12 véhicules"><Table columns={['#', 'Type', 'Immat.', 'Chantier', 'Chauffeur', 'Carburant/mois', 'Dernière visite', 'Statut']}>{trucks.map((row) => <tr key={row[0]}>{row.slice(0, 7).map((cell, index) => <td key={index}>{index === 5 ? `${cell} L` : cell}</td>)}<td><Badge tone={statusTone(row[7])}>{statusLabel(row[7])}</Badge></td></tr>)}</Table></Panel>; }
function Machines() { return <Panel title="🚜 Parc machines" subtitle="16 engins"><Table columns={['#', 'Machine', 'Référence', 'Chantier', 'Opérateur', 'Heures/mois', 'Prochain entretien', 'Statut']}>{machines.map((row) => <tr key={row[0]}>{row.slice(0, 7).map((cell, index) => <td key={index}>{cell}</td>)}<td><Badge tone={statusTone(row[7])}>{statusLabel(row[7])}</Badge></td></tr>)}</Table></Panel>; }
function FuelJournal() { return <Panel title="⛽ Journal carburant — aujourd'hui" subtitle="13 distributions • 1100 L total"><Table columns={['Heure', 'Pompiste', 'Engin', 'Plaque', 'Chauffeur', 'Quantité', 'Chantier']}>{fuelLog.map((row) => <tr key={`${row[0]}-${row[3]}`}>{row.map((cell, index) => <td key={index}>{index === 5 ? `${cell} L` : cell}</td>)}</tr>)}</Table></Panel>; }
