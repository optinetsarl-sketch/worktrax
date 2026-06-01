import { useState } from "react";
import { useAuth } from "../lib/auth";

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const u = await login(email, password);
      const map = { super_admin: "/system", admin: "/", superviseur: "/superviseur", rh: "/rh", controleur: "/controleur", pompiste: "/pompiste" };
      window.location.href = map[u.role] || "/";
    } catch (ex) {
      setErr(ex.response?.data?.detail || "Identifiants incorrects");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-screen" data-testid="login-screen">
      <div className="login-box">
        <div className="login-logo">
          <h1>WORK<span>TRAX</span></h1>
          <p>OPTINET SARLU • Gestion Multisites</p>
        </div>
        <h2>Connexion</h2>
        <form onSubmit={submit}>
          <div className="form-group">
            <label>Identifiant</label>
            <input
              className="form-input"
              data-testid="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.com"
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>Mot de passe</label>
            <div style={{ position: "relative" }}>
              <input
                className="form-input"
                data-testid="login-password"
                type={showPwd ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{ paddingRight: 70 }}
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", padding: "4px 10px", background: "#f1f5f9", borderRadius: 6, fontSize: ".75rem", color: "#475569" }}
                data-testid="toggle-pwd"
              >
                {showPwd ? "🙈 Cacher" : "👁 Voir"}
              </button>
            </div>
          </div>
          {err && <div className="login-error" data-testid="login-error">⚠️ {err}</div>}
          <button className="btn-login" type="submit" disabled={busy} data-testid="login-submit">
            {busy ? "Connexion…" : "🔐 Se connecter"}
          </button>
        </form>
        <div className="login-footer">© 2026 OPTINET SARLU • Tous droits réservés</div>
      </div>
    </div>
  );
}
