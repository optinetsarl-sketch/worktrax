import { useEffect, useMemo, useState } from 'react';
import { workers as mockWorkers, workerCategories as mockWorkerCategories } from '../data/workers.js';
import { Panel } from '../components/ui/Panel.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Table } from '../components/ui/Table.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Avatar } from '../components/ui/Avatar.jsx';
import { AddWorkerWizardModal } from '../modals/AddWorkerWizardModal.jsx';
import { WorkerProfileModal } from '../modals/WorkerProfileModal.jsx';
import {
  buildLookup,
  createWorker,
  extractErrorMessage,
  fetchSites,
  fetchSocietes,
  fetchTypeContrats,
  fetchTypeWorkers,
  fetchWorkers,
  mapWorker,
  normalizeList,
} from '../services/index.js';

const statusLabels = { present: 'Présent', absent: 'Absent', malade: 'Malade', conge: 'Congé', blesse: 'Blessé' };

export function WorkersPage() {
  const [category, setCategory] = useState('Tous');
  const [status, setStatus] = useState('Tous');
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const [workers, setWorkers] = useState(mockWorkers);
  const [options, setOptions] = useState({ typeWorkers: [], sites: [], societes: [], typeContrats: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [source, setSource] = useState('mock');

  const loadWorkers = async () => {
    setIsLoading(true);
    setError('');
    try {
      const [workersData, typeWorkers, sites, societes, typeContrats] = await Promise.all([
        fetchWorkers(),
        fetchTypeWorkers(),
        fetchSites(),
        fetchSocietes(),
        fetchTypeContrats(),
      ]);
      const nextOptions = {
        typeWorkers: normalizeList(typeWorkers),
        sites: normalizeList(sites),
        societes: normalizeList(societes),
        typeContrats: normalizeList(typeContrats),
      };
      const lookups = {
        typeWorkers: buildLookup(nextOptions.typeWorkers, 'nom'),
        sites: buildLookup(nextOptions.sites, 'name'),
        societes: buildLookup(nextOptions.societes, 'nom'),
        typeContrats: buildLookup(nextOptions.typeContrats, 'nom'),
      };
      setOptions(nextOptions);
      setWorkers(normalizeList(workersData).map((worker) => mapWorker(worker, lookups)));
      setSource('api');
    } catch (apiError) {
      setWorkers(mockWorkers);
      setSource('mock');
      setError(`API ouvriers indisponible, affichage mock temporaire : ${extractErrorMessage(apiError)}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWorkers();
  }, []);

  const workerCategories = useMemo(() => {
    if (source === 'mock') return mockWorkerCategories;
    const categories = [...new Set(workers.map((worker) => worker.category).filter(Boolean))];
    return [{ label: 'Tous', icon: '👥' }, ...categories.map((label) => ({ label, icon: '👷' }))];
  }, [source, workers]);

  const filtered = useMemo(() => workers.filter((worker) => {
    const byCategory = category === 'Tous' || worker.category === category;
    const byStatus = status === 'Tous' || worker.status === status;
    const query = search.toLowerCase();
    const bySearch = worker.name.toLowerCase().includes(query) || worker.phone.includes(search);
    return byCategory && byStatus && bySearch;
  }), [category, status, search, workers]);

  const handleCreateWorker = async (payload) => {
    const created = await createWorker(payload);
    await loadWorkers();
    return created;
  };

  return (
    <div className="stack">
      {error ? <div className="info-banner">{error}</div> : null}
      <div className="category-grid">
        {workerCategories.map((item) => {
          const count = item.label === 'Tous' ? workers.length : workers.filter((worker) => worker.category === item.label).length;
          return <button key={item.label} className={`category-card ${category === item.label ? 'selected' : ''}`} onClick={() => setCategory(item.label)}><span>{item.icon}</span><strong>{item.label}</strong><small>{count} ouvriers</small><em><i style={{ width: `${Math.max(8, count * 4)}%` }} /></em></button>;
        })}
      </div>
      <Panel title="👷 Liste des ouvriers" subtitle={`${isLoading ? 'Chargement...' : `${filtered.length} ouvriers affichés`} • Source ${source === 'api' ? 'API Django' : 'mock'}`} actions={<><input className="search-input" placeholder="🔍 Rechercher..." value={search} onChange={(event) => setSearch(event.target.value)} />{[['Tous', 'Tous'], ['Présents', 'present'], ['Absents', 'absent'], ['Malades', 'malade']].map(([label, value]) => <Button key={value} variant={status === value ? 'primary' : 'ghost'} onClick={() => setStatus(value)}>{label}</Button>)}<Button variant="ghost" onClick={loadWorkers}>🔄 API</Button><Button variant="accent" onClick={() => setAddOpen(true)}>+ Ajouter ouvrier</Button></>}>
        <Table columns={['Ouvrier', 'Catégorie', 'Chantier', 'Structure', 'Heures/mois', 'Statut', 'Actions']}>
          {filtered.map((worker) => <tr key={worker.id}><td><div className="worker-cell"><Avatar initials={worker.initials} color={worker.color} /><div><strong>{worker.name}</strong><small>{worker.phone}</small></div></div></td><td>{worker.category}</td><td>{worker.site}</td><td>{worker.structure}</td><td><strong>{worker.hours}h</strong></td><td><Badge tone={worker.status}>● {statusLabels[worker.status] || worker.status}</Badge></td><td><Button variant="ghost" onClick={() => setProfile(worker)}>👁 Fiche</Button></td></tr>)}
        </Table>
      </Panel>
      <AddWorkerWizardModal open={addOpen} onClose={() => setAddOpen(false)} onCreate={handleCreateWorker} options={options} apiEnabled={source === 'api'} />
      <WorkerProfileModal worker={profile} onClose={() => setProfile(null)} />
    </div>
  );
}
