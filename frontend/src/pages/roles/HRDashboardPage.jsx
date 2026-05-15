import { KpiCard } from '../../components/ui/KpiCard.jsx';
import { Panel } from '../../components/ui/Panel.jsx';
import { Table } from '../../components/ui/Table.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { payroll, absences } from '../../data/business.js';
import { useClock } from '../../hooks/useClock.js';

export function HRDashboardPage() {
  const { time, shortDate } = useClock();
  return <div className="stack"><div className="role-hero rh"><span>🧑‍💼</span><div><h2>Espace Ressources Humaines</h2><p>Gestion du personnel, absences, congés et paiements</p></div><strong>{time}<small>{shortDate}</small></strong></div><div className="kpi-grid"><KpiCard icon="👷" value="30" label="Ouvriers actifs" tone="blue" /><KpiCard icon="📅" value="2" label="Congés en cours" tone="orange" /><KpiCard icon="🏥" value="3" label="Arrêts maladie" tone="red" /><KpiCard icon="💰" value="3.2M" label="Masse salariale" tone="green" /></div><div className="grid-2"><Panel title="📋 Demandes en attente"><div className="request-list">{absences.slice(0, 3).map((row) => <div key={`${row[0]}-${row[2]}`}><strong>{row[0]} — {row[2]}</strong><small>Du {row[3]} au {row[4]} • {row[5]} j</small><span><Button>✓ Valider</Button><Button variant="ghost">✗ Refus</Button></span></div>)}</div></Panel><Panel title="📅 Calendrier absences"><Table columns={['Ouvrier', 'Type', 'Du', 'Au', 'Statut']}>{absences.slice(0, 7).map((row) => <tr key={`${row[0]}-${row[3]}`}><td>{row[0]}</td><td>{row[2]}</td><td>{row[3]}</td><td>{row[4]}</td><td>{row[7]}</td></tr>)}</Table></Panel></div><Panel title="💰 Récapitulatif paie — Avril 2026"><Table columns={['Ouvrier', 'Catégorie', 'Jours', 'Heures', 'Brut', 'CNSS', 'Net']}>{payroll.map((row) => <tr key={row[0]}><td>{row[0]}</td><td>{row[1]}</td><td>{row[3]}</td><td>{row[4]}</td><td>{row[5]}</td><td>{row[6]}</td><td>{row[7]}</td></tr>)}</Table></Panel></div>;
}
