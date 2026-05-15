import { useState } from 'react';
import { KpiCard } from '../../components/ui/KpiCard.jsx';
import { Panel } from '../../components/ui/Panel.jsx';
import { Table } from '../../components/ui/Table.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { useClock } from '../../hooks/useClock.js';

const scanWorkers = ['Yawa Togbe', 'Sena Agbo', 'Ama Koudjo', 'Mawuli Nuko'];
export function ControllerTerminalPage() {
  const { time, shortDate } = useClock();
  const [mode, setMode] = useState('Entrée');
  const [method, setMethod] = useState('Empreinte digitale');
  const [logs, setLogs] = useState([{ worker: 'Yawa Togbe', method: '👤 Faciale', type: 'Entrée', time: '14:27', status: '⏰ Retard 447min' }]);
  const [error, setError] = useState(false);
  const scan = () => { const worker = scanWorkers[logs.length % scanWorkers.length]; setError(logs.length % 3 === 1); if (logs.length % 3 !== 1) setLogs([{ worker, method: method.includes('Empreinte') ? '👆 Empreinte' : '👤 Faciale', type: mode, time: time.slice(0, 5), status: mode === 'Entrée' ? '⏰ Retard 443min' : "À l'heure" }, ...logs]); };
  return <div className="stack"><div className="role-hero controller"><span>📱</span><div><h2>Terminal de pointage biométrique</h2><p>Reconnaissance automatique — l'ouvrier scanne, le système identifie</p></div><strong>{time}<small>{shortDate}</small></strong></div><div className="terminal-tabs"><button className={method === 'Empreinte digitale' ? 'active' : ''} onClick={() => setMethod('Empreinte digitale')}>👆 Empreinte digitale</button><button className={method === 'Reconnaissance faciale' ? 'active' : ''} onClick={() => setMethod('Reconnaissance faciale')}>👤 Reconnaissance faciale</button><span /><button className={mode === 'Entrée' ? 'accent' : ''} onClick={() => setMode('Entrée')}>🟢 Entrée</button><button className={mode === 'Sortie' ? 'accent' : ''} onClick={() => setMode('Sortie')}>🔴 Sortie</button></div><div className="scan-panel"><span>👆</span>{error ? <div className="scan-error"><h3>🚨 NON RECONNU</h3><p>Tous les ouvriers enrôlés ont déjà pointé en entrée aujourd'hui</p></div> : <><h3>Posez le pouce sur le lecteur</h3><p>Identification automatique — pas besoin de sélectionner l'ouvrier</p></>}<Button variant="accent" onClick={scan}>▶ Scanner l'empreinte</Button></div><div className="kpi-grid"><KpiCard icon="✅" value={logs.length + 32} label="Pointés aujourd'hui" tone="green" /><KpiCard icon="⏳" value="0" label="Non encore pointés" tone="red" /><KpiCard icon="⏰" value="16" label="Retards signalés" tone="orange" /><KpiCard icon="👤" value="11" label="Total affectés" tone="blue" /></div><Panel title="📋 Derniers pointages enregistrés"><Table columns={['#', 'Ouvrier', 'Méthode', 'Type', 'Heure', 'Statut']}>{logs.map((log, index) => <tr key={`${log.worker}-${index}`}><td>{index + 1}</td><td>{log.worker}</td><td>{log.method}</td><td><Badge tone={log.type === 'Entrée' ? 'present' : 'absent'}>{log.type}</Badge></td><td>{log.time}</td><td><Badge tone={log.status.includes('Retard') ? 'maintenance' : 'present'}>{log.status}</Badge></td></tr>)}</Table></Panel></div>;
}
