import { KpiCard } from '../components/ui/KpiCard.jsx';
import { Panel } from '../components/ui/Panel.jsx';
import { Table } from '../components/ui/Table.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Avatar } from '../components/ui/Avatar.jsx';
import { users } from '../data/business.js';

export function UsersPage() {
  return <div className="stack"><div className="kpi-grid"><KpiCard icon="👥" value="6" label="Total utilisateurs" tone="blue" /><KpiCard icon="🛡️" value="1" label="Administrateurs" tone="purple" /><KpiCard icon="👷" value="2" label="Superviseurs" tone="green" /><KpiCard icon="📱" value="3" label="RH / Contrôleurs / Pompistes" tone="orange" /></div><Panel title="👥 Utilisateurs de la plateforme" subtitle="6 utilisateurs" actions={<><Button>Tous</Button><Button variant="ghost">Superviseurs</Button><Button variant="ghost">RH</Button><Button variant="ghost">Contrôleurs</Button><Button variant="accent">+ Créer un utilisateur</Button></>}><Table columns={['Utilisateur', 'Email', 'Rôle', 'Site', 'Créé le', 'Actions']}>{users.map((row) => <tr key={row[1]}><td><div className="worker-cell"><Avatar initials={row[0]} color="#2563a8" /><strong>{row[1]}</strong></div></td><td>{row[2]}</td><td>{row[3]}</td><td>{row[4]}</td><td>{row[5]}</td><td><Button variant="ghost">✏️ Modifier</Button></td></tr>)}</Table></Panel></div>;
}
