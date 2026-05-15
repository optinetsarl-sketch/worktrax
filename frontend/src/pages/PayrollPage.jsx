import { KpiCard } from '../components/ui/KpiCard.jsx';
import { Panel } from '../components/ui/Panel.jsx';
import { Table } from '../components/ui/Table.jsx';
import { Button } from '../components/ui/Button.jsx';
import { payroll } from '../data/business.js';

export function PayrollPage() {
  return <div className="stack"><div className="kpi-grid"><KpiCard icon="💰" value="3.2M" label="Masse salariale (FCFA)" tone="green" /><KpiCard icon="👷" value="15" label="Bulletins générés" tone="blue" /><KpiCard icon="⏱️" value="2141h" label="Heures totales" tone="orange" /><KpiCard icon="📋" value="183 583 FCFA" label="CNSS retenue" tone="red" /></div><Panel title="📋 Bulletins de paie — Avril 2026" actions={<><Button variant="ghost">📥 Export Excel</Button><Button>📄 Imprimer bulletins</Button></>}><Table columns={['Ouvrier', 'Catégorie', 'Mois', 'Jours', 'Heures', 'Brut', 'CNSS', 'Net']}>{payroll.map((row) => <tr key={row[0]}>{row.map((cell) => <td key={cell}>{cell}</td>)}</tr>)}</Table></Panel></div>;
}
