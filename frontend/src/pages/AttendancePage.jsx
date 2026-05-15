import { KpiCard } from '../components/ui/KpiCard.jsx';
import { Panel } from '../components/ui/Panel.jsx';
import { Table } from '../components/ui/Table.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { attendanceRows } from '../data/business.js';
import { useClock } from '../hooks/useClock.js';

export function AttendancePage() {
  const { time, shortDate } = useClock();
  return <div className="stack"><div className="role-hero admin"><span>📍</span><div><h2>Vue d'ensemble des pointages</h2><p>Tous les sites • Mise à jour temps réel</p></div><strong>{time}<small>{shortDate}</small></strong></div><div className="kpi-grid"><KpiCard icon="✅" value="33" label="Pointés (entrée)" tone="green" /><KpiCard icon="🚪" value="3" label="Pointés (sortie)" tone="blue" /><KpiCard icon="⏰" value="16" label="Retards" tone="orange" /><KpiCard icon="📊" value="36" label="Total enregistrements" tone="red" /></div><Panel title="📋 Journal des pointages — 11/05/2026"><Table columns={['#', 'Ouvrier', 'Type', 'Heure', 'Méthode', 'Contrôleur', 'Chantier', 'Statut']}>{attendanceRows.map((row) => <tr key={row[0]}>{row.map((cell, index) => <td key={index}>{index === 2 ? <Badge tone={cell === 'Entrée' ? 'present' : 'absent'}>{cell}</Badge> : index === 7 ? <Badge tone={cell.includes('Retard') ? 'maintenance' : 'present'}>{cell}</Badge> : cell}</td>)}</tr>)}</Table></Panel></div>;
}
