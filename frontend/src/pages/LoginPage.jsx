import { useState } from 'react';
import { ROLES } from '../config/roles.js';
import { Button } from '../components/ui/Button.jsx';
import { extractErrorMessage, login } from '../services/index.js';

const credentials = {
  Administrateur: ['admin', 'admin123'],
  RH: ['rh', 'rh123'],
  Superviseur: ['superviseur', 'sup123'],
  Contrôleur: ['controleur', 'ctrl123'],
  Pompiste: ['pompiste', 'pump123'],
};

export function LoginPage({ onLogin }) {
  const [role, setRole] = useState('Administrateur');
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState(credentials.Administrateur[0]);
  const [password, setPassword] = useState(credentials.Administrateur[1]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const changeRole = (nextRole) => {
    setRole(nextRole);
    const [nextUsername, nextPassword] = credentials[nextRole];
    setUsername(nextUsername);
    setPassword(nextPassword);
  };

  const submit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const session = await login({ username, password, role });
      onLogin(session);
    } catch (apiError) {
      setError(extractErrorMessage(apiError));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="login-page">
      <form className="login-card" onSubmit={submit}>
        <div className="login-logo">WORK<span>TRAX</span></div>
        <p className="login-subtitle">OPTINET SARLU • GESTION MULTISITES</p>
        <h1>Connexion API</h1>
        {error ? <div className="error-box">{error}</div> : null}
        <label>Identifiant</label>
        <input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Nom d'utilisateur Django" />
        <label>Mot de passe</label>
        <div className="password-field">
          <input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} />
          <button type="button" onClick={() => setShowPassword((value) => !value)}>{showPassword ? '🙈 Cacher' : '👁 Voir'}</button>
        </div>
        <label>Rôle interface</label>
        <select value={role} onChange={(event) => changeRole(event.target.value)}>
          {Object.keys(ROLES).map((roleName) => <option key={roleName}>{roleName}</option>)}
        </select>
        <Button className="login-submit" disabled={isLoading}>{isLoading ? 'Connexion...' : '🔐 Se connecter'}</Button>
        <div className="login-tip">💡 Le rôle pilote l'interface. L'authentification est faite via <code>/api/users/login/</code>.</div>
        <footer>© 2026 OPTINET SARLU • Tous droits réservés</footer>
      </form>
    </main>
  );
}
