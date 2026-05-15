import { Panel } from '../components/ui/Panel.jsx';
import { Table } from '../components/ui/Table.jsx';
import { fuelLog } from '../data/engines.js';
import { workers } from '../data/workers.js';

export function ReportsPage() {
  const groups = ['Conducteur', 'Pompiste', 'Maçon', 'Manœuvre', 'Électricien', 'Peintre', 'Plombier', 'Ferrailleur'];
  return <div className="stack"><div className="grid-2"><Panel title="📊 Heures par catégorie"><div className="bar-chart report">{groups.map((group) => <span key={group} style={{ height: `${workers.filter((w) => w.category === group).length * 10}%` }}><small>{group}</small></span>)}</div></Panel><Panel title="🥧 Répartition métiers"><div className="pie-fake">{groups.map((group) => <span key={group}>{group}</span>)}</div></Panel></div><Panel title="⛽ Consommation carburant — mois" subtitle="13 distributions • 1100 L"><Table columns={['Plaque', 'Engin', 'Total litres', 'Nb ravitaillements']}>{fuelLog.slice(0, 10).map((row) => <tr key={row[3]}><td>{row[3]}</td><td>{row[2]}</td><td>{row[5]} L</td><td>1</td></tr>)}</Table></Panel></div>;
}
