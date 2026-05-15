import { useState } from 'react';
import { Modal } from '../components/ui/Modal.jsx';
import { Button } from '../components/ui/Button.jsx';

export function AddWorkerWizardModal({ open, onClose }) {
  const [step, setStep] = useState(1);
  const close = () => { setStep(1); onClose(); };
  return (
    <Modal open={open} onClose={close} title={`+ Ajouter un ouvrier — Étape ${step}/3`}>
      {step === 1 ? <StepInfo /> : null}
      {step === 2 ? <StepFace /> : null}
      {step === 3 ? <StepFinger /> : null}
      <div className="modal-actions">
        {step > 1 ? <Button variant="ghost" onClick={() => setStep(step - 1)}>← Retour</Button> : <span />}
        {step < 3 ? <Button variant="accent" onClick={() => setStep(step + 1)}>Suivant →</Button> : <Button variant="accent" onClick={close}>✓ Enregistrer l'ouvrier</Button>}
      </div>
    </Modal>
  );
}

function StepInfo() {
  return <div><h4>📝 ÉTAPE 1 — INFORMATIONS PERSONNELLES</h4><div className="form-grid"><label>Nom complet *<input defaultValue="Yao Doc" /></label><label>Téléphone *<input defaultValue="+228 90 88 77 66" /></label><label>Catégorie<select defaultValue="Maçon"><option>Maçon</option><option>Conducteur</option><option>Pompiste</option></select></label><label>Chantier<select defaultValue="Lomé-Agoè"><option>Lomé-Agoè</option><option>Kégué</option><option>Baguida</option></select></label><label>Structure<select><option>EBOMAF</option><option>Sous-traitant</option></select></label><label>Contrat<select><option>CDI</option><option>CDD</option><option>Journalier</option></select></label></div></div>;
}
function StepFace() {
  return <div><h4>📷 ÉTAPE 2 — ENRÔLEMENT RECONNAISSANCE FACIALE</h4><div className="wizard-split"><div className="camera-box"><span>📷</span><strong>Cliquez pour activer la webcam et capturer le visage</strong><Button variant="accent">▶ Activer la webcam</Button></div><div className="instructions"><strong>ℹ️ Instructions</strong><p>Cadrer le visage dans le cercle</p><p>Bon éclairage, fond neutre</p><p>Retirer lunettes / casquette</p><em>⏳ En attente de capture</em></div></div></div>;
}
function StepFinger() {
  return <div><h4>👆 ÉTAPE 3 — ENRÔLEMENT EMPREINTE DIGITALE</h4><div className="finger-ok"><span>✅</span><h3>Empreinte enregistrée</h3><p>L'empreinte servira au pointage biométrique</p><Button variant="accent">✗ Retirer l'empreinte</Button></div><div className="hint">💡 L'ouvrier doit être enrôlé en visage ou empreinte pour pouvoir pointer automatiquement.</div></div>;
}
