import { KpiCard } from '../components/ui/KpiCard.jsx';
import { Panel } from '../components/ui/Panel.jsx';
import { Table } from '../components/ui/Table.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { absences } from '../data/business.js';

export function AbsencesPage() {
  return <div className="stack"><div className="kpi-grid"><KpiCard icon="🌴" value="2" label="Congés" tone="purple" /><KpiCard icon="🏥" value="3" label="Maladies" tone="orange" /><KpiCard icon="🩹" value="4" label="Accidents" tone="red" /><KpiCard icon="?" value="5" label="Injustifiées" tone="blue" /></div><Panel title="📋 Toutes les absences" actions={<><Button>Tous</Button><Button variant="ghost">Congés</Button><Button variant="ghost">Maladie</Button><Button variant="ghost">Accident</Button><Button variant="accent">+ Nouvelle absence</Button></>}><Table columns={['Ouvrier', 'Catégorie', 'Type', 'Du', 'Au', 'Jours', 'Justificatif', 'Statut']}>{absences.map((row) => <tr key={`${row[0]}-${row[2]}-${row[3]}`}>{row.map((cell, index) => <td key={index}>{index > 5 ? <Badge tone={String(cell).includes('Joint') || cell === 'valide' ? 'present' : 'absent'}>{cell}</Badge> : cell}</td>)}</tr>)}</Table></Panel></div>;
}
