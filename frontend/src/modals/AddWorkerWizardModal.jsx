import { useState } from 'react';
import { Modal } from '../components/ui/Modal.jsx';
import { Button } from '../components/ui/Button.jsx';
import { extractErrorMessage } from '../services/index.js';

const initialForm = {
  nom_complet: '',
  phone: '',
  type_worker: '',
  site: '',
  societe: '',
  type_contrat: '',
  is_active: true,
};

export function AddWorkerWizardModal({ open, onClose, onCreate, options, apiEnabled }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(initialForm);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const close = () => { setStep(1); setForm(initialForm); setError(''); onClose(); };
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const submit = async () => {
    if (!apiEnabled) {
      close();
      return;
    }
    setIsSaving(true);
    setError('');
    try {
      await onCreate({
        ...form,
        type_worker: Number(form.type_worker),
        site: Number(form.site),
      });
      close();
    } catch (apiError) {
      setError(extractErrorMessage(apiError));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={close} title={`+ Ajouter un ouvrier — Étape ${step}/3`}>
      {error ? <div className="error-box">{error}</div> : null}
      {!apiEnabled ? <div className="info-banner">API ouvriers indisponible : ce formulaire reste en mode démonstration.</div> : null}
      {step === 1 ? <StepInfo form={form} update={update} options={options} apiEnabled={apiEnabled} /> : null}
      {step === 2 ? <StepFace /> : null}
      {step === 3 ? <StepFinger /> : null}
      <div className="modal-actions">
        {step > 1 ? <Button variant="ghost" onClick={() => setStep(step - 1)}>← Retour</Button> : <span />}
        {step < 3 ? <Button variant="accent" onClick={() => setStep(step + 1)}>Suivant →</Button> : <Button variant="accent" onClick={submit} disabled={isSaving}>{isSaving ? 'Enregistrement...' : '✓ Enregistrer l\'ouvrier'}</Button>}
      </div>
    </Modal>
  );
}

function StepInfo({ form, update, options, apiEnabled }) {
  const canUseApiSelects = apiEnabled && options.typeWorkers.length && options.sites.length && options.societes.length && options.typeContrats.length;
  return <div><h4>📝 ÉTAPE 1 — INFORMATIONS PERSONNELLES</h4><div className="form-grid"><label>Nom complet *<input value={form.nom_complet} onChange={(event) => update('nom_complet', event.target.value)} placeholder="Yao Doc" /></label><label>Téléphone *<input value={form.phone} onChange={(event) => update('phone', event.target.value)} placeholder="+228 90 88 77 66" /></label><label>Catégorie<select value={form.type_worker} onChange={(event) => update('type_worker', event.target.value)} disabled={!canUseApiSelects}><option value="">Sélectionner</option>{options.typeWorkers.map((item) => <option key={item.id} value={item.id}>{item.nom}</option>)}</select></label><label>Chantier<select value={form.site} onChange={(event) => update('site', event.target.value)} disabled={!canUseApiSelects}><option value="">Sélectionner</option>{options.sites.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label>Structure<select value={form.societe} onChange={(event) => update('societe', event.target.value)} disabled={!canUseApiSelects}><option value="">Sélectionner</option>{options.societes.map((item) => <option key={item.id} value={item.id}>{item.nom}</option>)}</select></label><label>Contrat<select value={form.type_contrat} onChange={(event) => update('type_contrat', event.target.value)} disabled={!canUseApiSelects}><option value="">Sélectionner</option>{options.typeContrats.map((item) => <option key={item.id} value={item.id}>{item.nom}</option>)}</select></label></div></div>;
}
function StepFace() {
  return <div><h4>📷 ÉTAPE 2 — ENRÔLEMENT RECONNAISSANCE FACIALE</h4><div className="wizard-split"><div className="camera-box"><span>📷</span><strong>Cliquez pour activer la webcam et capturer le visage</strong><Button variant="accent">▶ Activer la webcam</Button></div><div className="instructions"><strong>ℹ️ Instructions</strong><p>Cadrer le visage dans le cercle</p><p>Bon éclairage, fond neutre</p><p>Retirer lunettes / casquette</p><em>⏳ En attente de capture</em></div></div></div>;
}
function StepFinger() {
  return <div><h4>👆 ÉTAPE 3 — ENRÔLEMENT EMPREINTE DIGITALE</h4><div className="finger-ok"><span>✅</span><h3>Empreinte enregistrée</h3><p>L'empreinte servira au pointage biométrique</p><Button variant="accent">✗ Retirer l'empreinte</Button></div><div className="hint">💡 L'ouvrier doit être enrôlé en visage ou empreinte pour pouvoir pointer automatiquement.</div></div>;
}
