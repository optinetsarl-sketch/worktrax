import { KpiCard } from '../../components/ui/KpiCard.jsx';
import { Panel } from '../../components/ui/Panel.jsx';
import { Table } from '../../components/ui/Table.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Avatar } from '../../components/ui/Avatar.jsx';
import { workers } from '../../data/workers.js';
import { useClock } from '../../hooks/useClock.js';

export function SupervisorDashboardPage() {
  const { time, shortDate } = useClock();
  const siteWorkers = workers.filter((worker) => worker.site === 'Lomé-Agoè').slice(0, 11);
  return <div className="stack"><div className="role-hero supervisor"><span>👷</span><div><h2>Espace Superviseur — Chantier Lomé-Agoè</h2><p>Suivi opérationnel en temps réel</p></div><strong>{time}<small>{shortDate}</small></strong></div><div className="kpi-grid"><KpiCard icon="✅" value="11" label="Présents aujourd'hui" tone="green" sub="🔴 0 absents sur 11" /><KpiCard icon="⏱️" value="1674h" label="Heures ce mois" tone="blue" /><KpiCard icon="🚜" value="7/8" label="Engins en service" tone="orange" sub="⚠️ 1 maintenance" /><KpiCard icon="⚠️" value="0" label="Alertes ouvriers" tone="red" /></div><Panel title="👷 Ouvriers — Lomé-Agoè" subtitle="11 ouvriers affectés"><Table columns={['Ouvrier', 'Métier', 'Heures', 'Statut']}>{siteWorkers.map((worker) => <tr key={worker.id}><td><div className="worker-cell"><Avatar initials={worker.initials} color={worker.color} />{worker.name}</div></td><td>{worker.category}</td><td>{worker.hours}h</td><td><Badge tone="present">● present</Badge></td></tr>)}</Table></Panel></div>;
}
