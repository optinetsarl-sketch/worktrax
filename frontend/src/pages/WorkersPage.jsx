import { useMemo, useState } from 'react';
import { workers, workerCategories } from '../data/workers.js';
import { Panel } from '../components/ui/Panel.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Table } from '../components/ui/Table.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Avatar } from '../components/ui/Avatar.jsx';
import { AddWorkerWizardModal } from '../modals/AddWorkerWizardModal.jsx';
import { WorkerProfileModal } from '../modals/WorkerProfileModal.jsx';

const statusLabels = { present: 'Présent', absent: 'Absent', malade: 'Malade', conge: 'Congé', blesse: 'Blessé' };

export function WorkersPage() {
  const [category, setCategory] = useState('Tous');
  const [status, setStatus] = useState('Tous');
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [profile, setProfile] = useState(null);

  const filtered = useMemo(() => workers.filter((worker) => {
    const byCategory = category === 'Tous' || worker.category === category;
    const byStatus = status === 'Tous' || worker.status === status;
    const bySearch = worker.name.toLowerCase().includes(search.toLowerCase()) || worker.phone.includes(search);
    return byCategory && byStatus && bySearch;
  }), [category, status, search]);

  return (
    <div className="stack">
      <div className="category-grid">
        {workerCategories.map((item) => {
          const count = item.label === 'Tous' ? workers.length : workers.filter((worker) => worker.category === item.label).length;
          return <button key={item.label} className={`category-card ${category === item.label ? 'selected' : ''}`} onClick={() => setCategory(item.label)}><span>{item.icon}</span><strong>{item.label}</strong><small>{count} ouvriers</small><em><i style={{ width: `${Math.max(8, count * 4)}%` }} /></em></button>;
        })}
      </div>
      <Panel title="👷 Liste des ouvriers" subtitle={`${filtered.length} ouvriers affichés`} actions={<><input className="search-input" placeholder="🔍 Rechercher..." value={search} onChange={(event) => setSearch(event.target.value)} />{[['Tous', 'Tous'], ['Présents', 'present'], ['Absents', 'absent'], ['Malades', 'malade']].map(([label, value]) => <Button key={value} variant={status === value ? 'primary' : 'ghost'} onClick={() => setStatus(value)}>{label}</Button>)}<Button variant="accent" onClick={() => setAddOpen(true)}>+ Ajouter ouvrier</Button></>}>
        <Table columns={['Ouvrier', 'Catégorie', 'Chantier', 'Structure', 'Heures/mois', 'Statut', 'Actions']}>
          {filtered.map((worker) => <tr key={worker.id}><td><div className="worker-cell"><Avatar initials={worker.initials} color={worker.color} /><div><strong>{worker.name}</strong><small>{worker.phone}</small></div></div></td><td>{worker.category}</td><td>{worker.site}</td><td>{worker.structure}</td><td><strong>{worker.hours}h</strong></td><td><Badge tone={worker.status}>● {statusLabels[worker.status]}</Badge></td><td><Button variant="ghost" onClick={() => setProfile(worker)}>👁 Fiche</Button></td></tr>)}
        </Table>
      </Panel>
      <AddWorkerWizardModal open={addOpen} onClose={() => setAddOpen(false)} />
      <WorkerProfileModal worker={profile} onClose={() => setProfile(null)} />
    </div>
  );
}
