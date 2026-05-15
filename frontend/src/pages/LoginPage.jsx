import { useState } from 'react';
import { ROLES } from '../config/roles.js';
import { Button } from '../components/ui/Button.jsx';

const credentials = {
  Administrateur: ['admin@optinet.tg', 'admin123'],
  RH: ['rh@optinet.tg', 'rh123'],
  Superviseur: ['superviseur@optinet.tg', 'sup123'],
  Contrôleur: ['controleur@optinet.tg', 'ctrl123'],
  Pompiste: ['pompiste@optinet.tg', 'pump123'],
};

export function LoginPage({ onLogin }) {
  const [role, setRole] = useState('Administrateur');
  const [showPassword, setShowPassword] = useState(false);
  const [email, password] = credentials[role];

  return (
    <main className="login-page">
      <form className="login-card" onSubmit={(event) => { event.preventDefault(); onLogin(role); }}>
        <div className="login-logo">WORK<span>TRAX</span></div>
        <p className="login-subtitle">OPTINET SARLU • GESTION MULTISITES</p>
        <h1>Connexion</h1>
        <label>Identifiant</label>
        <input value={email} readOnly />
        <label>Mot de passe</label>
        <div className="password-field">
          <input type={showPassword ? 'text' : 'password'} value={password} readOnly />
          <button type="button" onClick={() => setShowPassword((value) => !value)}>{showPassword ? '🙈 Cacher' : '👁 Voir'}</button>
        </div>
        <label>Rôle</label>
        <select value={role} onChange={(event) => setRole(event.target.value)}>
          {Object.keys(ROLES).map((roleName) => <option key={roleName}>{roleName}</option>)}
        </select>
        <Button className="login-submit">🔐 Se connecter</Button>
        <div className="login-tip">💡 Astuce : sélectionnez un rôle, les identifiants se remplissent automatiquement.</div>
        <footer>© 2026 OPTINET SARLU • Tous droits réservés</footer>
      </form>
    </main>
  );
}
