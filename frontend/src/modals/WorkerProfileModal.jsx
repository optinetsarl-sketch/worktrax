import { useState } from 'react';
import { Modal } from '../components/ui/Modal.jsx';
import { Avatar } from '../components/ui/Avatar.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Table } from '../components/ui/Table.jsx';
import { Button } from '../components/ui/Button.jsx';

export function WorkerProfileModal({ worker, onClose }) {
  const [tab, setTab] = useState('Informations');
  if (!worker) return null;
  return (
    <Modal open={Boolean(worker)} onClose={onClose} title="📋 Fiche ouvrier" width={900}>
      <div className="profile-header"><Avatar initials={worker.initials} color={worker.color} /><div><h2>{worker.name}</h2><p>{worker.category} • {worker.site} • {worker.structure}</p><small>📅 Recruté le 15/01/2024 • CDI</small></div><Badge tone={worker.status}>● {worker.status}</Badge></div>
      <div className="tabs">{['Informations', 'Pointages', 'Engins', 'Paiements', 'Absences'].map((name) => <button key={name} className={tab === name ? 'active' : ''} onClick={() => setTab(name)}>{name}</button>)}</div>
      {tab === 'Informations' ? <Info worker={worker} /> : <History tab={tab} />}
      <div className="modal-actions"><Button variant="ghost" onClick={onClose}>Fermer</Button><Button>📄 Export PDF</Button><Button variant="accent">✏️ Modifier fiche</Button></div>
    </Modal>
  );
}
function Info({ worker }) { return <div className="form-grid readonly"><label>Nom complet<input readOnly value={worker.name} /></label><label>Téléphone<input readOnly value={worker.phone} /></label><label>Catégorie<input readOnly value={worker.category} /></label><label>Chantier<input readOnly value={worker.site} /></label><label>Structure<input readOnly value={worker.structure} /></label><label>Heures ce mois<input readOnly value={`${worker.hours}h`} /></label></div>; }
function History({ tab }) { return <Table columns={['Date', 'Détail', 'Durée', 'Statut']}><tr><td>08/05/2026</td><td>{tab}</td><td>9h 45min</td><td><Badge tone="present">✓ OK</Badge></td></tr><tr><td>07/05/2026</td><td>{tab}</td><td>8h 30min</td><td><Badge tone="present">✓ OK</Badge></td></tr></Table>; }
