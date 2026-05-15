import { useEffect, useMemo, useState } from 'react';
import { trucks as mockTrucks, machines as mockMachines, fuelLog } from '../data/engines.js';
import { KpiCard } from '../components/ui/KpiCard.jsx';
import { Panel } from '../components/ui/Panel.jsx';
import { Table } from '../components/ui/Table.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { extractErrorMessage, fetchMachines, mapMachine, normalizeList } from '../services/index.js';

export function EnginesPage({ initialTab = 'trucks' }) {
  const [tab, setTab] = useState(initialTab);
  const [engines, setEngines] = useState([]);
  const [source, setSource] = useState('mock');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const loadMachines = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await fetchMachines();
      setEngines(normalizeList(data).map(mapMachine));
      setSource('api');
    } catch (apiError) {
      setEngines([]);
      setSource('mock');
      setError(`API engins indisponible, affichage mock temporaire : ${extractErrorMessage(apiError)}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMachines();
  }, []);

  const apiTrucks = useMemo(() => engines.filter((engine) => engine.isTruck), [engines]);
  const apiMachines = useMemo(() => engines.filter((engine) => !engine.isTruck), [engines]);
  const displayedTrucks = source === 'api' && apiTrucks.length ? apiTrucks : mockTrucks;
  const displayedMachines = source === 'api' && apiMachines.length ? apiMachines : mockMachines;
  const displayedFleet = tab === 'trucks' ? displayedTrucks : tab === 'machines' ? displayedMachines : engines;
  const serviceCount = tab === 'fuel' ? 23 : displayedFleet.filter((item) => (Array.isArray(item) ? item[7] === 'service' : item.status === 'service')).length;
  const maintenanceCount = displayedFleet.filter((item) => (Array.isArray(item) ? item[7] === 'maintenance' : item.status === 'maintenance')).length;
  const outCount = tab === 'fuel' ? 2 : displayedFleet.filter((item) => (Array.isArray(item) ? item[7] === 'out' : item.status === 'out')).length;

  return (
    <div className="stack">
      {error ? <div className="info-banner">{error}</div> : null}
      <div className="kpi-grid"><KpiCard icon="✅" value={isLoading ? '...' : serviceCount} label="En service" tone="green" /><KpiCard icon="⚠️" value={maintenanceCount} label="En maintenance" tone="orange" /><KpiCard icon="🚫" value={outCount} label="Hors service" tone="red" /><KpiCard icon="⛽" value={tab === 'fuel' ? '1100 L' : '0 L'} label="Carburant aujourd'hui" tone="blue" /></div>
      <div className="tabs page-tabs"><button className={tab === 'trucks' ? 'active' : ''} onClick={() => setTab('trucks')}>🚛 Camions</button><button className={tab === 'machines' ? 'active' : ''} onClick={() => setTab('machines')}>🚜 Machines</button><button className={tab === 'fuel' ? 'active' : ''} onClick={() => setTab('fuel')}>⛽ Carburant & Pompistes</button><ButtonRefresh onClick={loadMachines} /></div>
      {tab === 'trucks' ? <Trucks rows={displayedTrucks} source={source} /> : null}
      {tab === 'machines' ? <Machines rows={displayedMachines} source={source} /> : null}
      {tab === 'fuel' ? <FuelJournal /> : null}
    </div>
  );
}
function ButtonRefresh({ onClick }) { return <button type="button" onClick={onClick}>🔄 API</button>; }
function statusTone(status) { return status === 'service' ? 'present' : status === 'maintenance' ? 'maintenance' : 'neutral'; }
function statusLabel(status) { return status === 'service' ? '● En service' : status === 'maintenance' ? '⚠ Maintenance' : '● Hors service'; }
function Trucks({ rows, source }) { return <Panel title="🚛 Parc camions" subtitle={`${rows.length} véhicules • Source ${source === 'api' ? 'API Django' : 'mock'}`}><Table columns={['#', 'Type', 'Immat.', 'Chantier', 'Chauffeur', 'Carburant/mois', 'Dernière visite', 'Statut']}>{rows.map((row, index) => Array.isArray(row) ? <tr key={row[0]}>{row.slice(0, 7).map((cell, cellIndex) => <td key={cellIndex}>{cellIndex === 5 ? `${cell} L` : cell}</td>)}<td><Badge tone={statusTone(row[7])}>{statusLabel(row[7])}</Badge></td></tr> : <tr key={row.id}><td>{index + 1}</td><td>{row.type}</td><td>{row.reference}</td><td>{row.site}</td><td>{row.operator}</td><td>0 L</td><td>{row.maintenanceDate}</td><td><Badge tone={statusTone(row.status)}>{statusLabel(row.status)}</Badge></td></tr>)}</Table></Panel>; }
function Machines({ rows, source }) { return <Panel title="🚜 Parc machines" subtitle={`${rows.length} engins • Source ${source === 'api' ? 'API Django' : 'mock'}`}><Table columns={['#', 'Machine', 'Référence', 'Chantier', 'Opérateur', 'Heures/mois', 'Prochain entretien', 'Statut']}>{rows.map((row, index) => Array.isArray(row) ? <tr key={row[0]}>{row.slice(0, 7).map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}<td><Badge tone={statusTone(row[7])}>{statusLabel(row[7])}</Badge></td></tr> : <tr key={row.id}><td>{index + 1}</td><td>{row.type}</td><td>{row.brandModel}</td><td>{row.site}</td><td>{row.operator}</td><td>{row.hours}</td><td>{row.maintenanceDate}</td><td><Badge tone={statusTone(row.status)}>{statusLabel(row.status)}</Badge></td></tr>)}</Table></Panel>; }
function FuelJournal() { return <Panel title="⛽ Journal carburant — aujourd'hui" subtitle="13 distributions • 1100 L total • Mock temporaire"><Table columns={['Heure', 'Pompiste', 'Engin', 'Plaque', 'Chauffeur', 'Quantité', 'Chantier']}>{fuelLog.map((row) => <tr key={`${row[0]}-${row[3]}`}>{row.map((cell, index) => <td key={index}>{index === 5 ? `${cell} L` : cell}</td>)}</tr>)}</Table></Panel>; }
