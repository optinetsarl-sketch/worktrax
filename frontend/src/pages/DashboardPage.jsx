import { KpiCard } from '../components/ui/KpiCard.jsx';
import { Panel } from '../components/ui/Panel.jsx';
import { Button } from '../components/ui/Button.jsx';
import { workers } from '../data/workers.js';

function BarChart() {
  const bars = [72, 78, 80, 75, 84, 42, 0];
  return <div className="bar-chart">{bars.map((height, index) => <span key={index} style={{ height: `${height}%` }} />)}</div>;
}

export function DashboardPage() {
  const present = workers.filter((worker) => worker.status === 'present').length;
  return (
    <div className="stack">
      <div className="page-heading">
        <div><h2>Bonjour, Administrateur 👋</h2><p>Vue d'ensemble en temps réel — lundi 11 mai 2026</p></div>
        <div className="actions"><Button variant="ghost">📊 Exporter rapport</Button><Button>🔄 Actualiser</Button></div>
      </div>
      <div className="kpi-grid">
        <KpiCard icon="👷" value={workers.length} label="Total Ouvriers inscrits" sub="📍 6 chantiers actifs" tone="blue" trend="↑ Multisites" />
        <KpiCard icon="✅" value={present} label="Présents aujourd'hui" sub="🔴 0 absents" tone="green" trend="93%" />
        <KpiCard icon="⏱️" value="4 365" label="Heures travaillées ce mois" sub="📅 Moy. 7.4 h/jour" tone="orange" trend="+4%" />
        <KpiCard icon="🚜" value="23/28" label="Engins en service" sub="⚠️ 3 maintenance • 12 camions + 16 machines" tone="red" trend="82%" />
      </div>
      <div className="grid-2">
        <Panel title="📈 Productivité hebdomadaire" subtitle="Heures travaillées vs objectif"><BarChart /></Panel>
        <Panel title="🚜 Utilisation engins par site" subtitle="Taux d'exploitation">
          <div className="h-bars">{['Kégué', 'Lomé-Agoè', 'Adéwui', 'Baguida', 'Tsévié'].map((site, index) => <div key={site}><span>{site}</span><em style={{ width: `${[80, 88, 100, 60, 75][index]}%` }} /></div>)}</div>
        </Panel>
      </div>
      <div className="grid-3">
        <Panel title="📊 Statuts ouvriers"><div className="donut"><span>{present}</span></div><Legend /></Panel>
        <Panel title="⚡ Activités récentes"><ActivityList /></Panel>
        <Panel title="👷 Répartition métiers"><JobsDistribution /></Panel>
      </div>
    </div>
  );
}

function Legend() {
  return <div className="legend"><p><span className="dot green" />Présents <strong>28</strong></p><p><span className="dot red" />Absents <strong>0</strong></p><p><span className="dot orange" />Malades <strong>0</strong></p><p><span className="dot purple" />Congés <strong>0</strong></p><p><span className="dot darkred" />Blessés <strong>2</strong></p></div>;
}

function ActivityList() {
  return <ul className="activity-list">{['Yawa Togbe — Pointage entry', 'Sena Agbo — Pointage entry', 'Ama Koudjo — Pointage entry', 'Finisseur — 70L distribués', 'Rouleau lisse — 85L distribués', 'Grader — 100L distribués'].map((item, index) => <li key={item}><span className={index > 2 ? 'orange-dot' : ''} /> <strong>{item}</strong><small>{index > 2 ? '13:00 • Lomé-Agoè' : '14:27 • Kégué'}</small></li>)}</ul>;
}

function JobsDistribution() {
  const groups = ['Conducteur', 'Pompiste', 'Maçon', 'Manœuvre', 'Électricien', 'Peintre', 'Plombier', 'Ferrailleur'];
  return <div className="jobs-list">{groups.map((group) => { const count = workers.filter((worker) => worker.category === group).length; return <div key={group}><p><span>{group}</span><strong>{count}</strong></p><em><i style={{ width: `${count * 12}%` }} /></em></div>; })}</div>;
}
