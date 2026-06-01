import { createContext, useContext, useEffect, useState } from "react";
import http from "./api";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("wt_user");
    return raw ? JSON.parse(raw) : null;
  });
  const [checking, setChecking] = useState(!!localStorage.getItem("wt_token") && !user);

  useEffect(() => {
    const t = localStorage.getItem("wt_token");
    if (t && !user) {
      http.get("/auth/me").then((r) => {
        setUser(r.data);
        localStorage.setItem("wt_user", JSON.stringify(r.data));
        setChecking(false);
      }).catch(() => {
        localStorage.removeItem("wt_token");
        localStorage.removeItem("wt_user");
        setChecking(false);
      });
    } else {
      setChecking(false);
    }
    // eslint-disable-next-line
  }, []);

  const login = async (email, password) => {
    const { data } = await http.post("/auth/login", { email, password });
    localStorage.setItem("wt_token", data.token);
    localStorage.setItem("wt_user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem("wt_token");
    localStorage.removeItem("wt_user");
    setUser(null);
    window.location.href = "/login";
  };

  return <AuthCtx.Provider value={{ user, login, logout, checking }}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  return useContext(AuthCtx);
}

export function ProtectedRoute({ children, roles }) {
  const { user, checking } = useAuth();
  if (checking) return <div style={{ padding: 40, textAlign: "center" }}>Chargement…</div>;
  if (!user) {
    window.location.href = "/login";
    return null;
  }
  if (roles && user.role !== "super_admin" && !roles.includes(user.role)) {
    const homeMap = { super_admin: "/system", admin: "/", superviseur: "/superviseur", rh: "/rh", controleur: "/controleur", pompiste: "/pompiste" };
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, background: "linear-gradient(135deg, #f4f6fa 0%, #e2e8f0 100%)" }}>
        <div style={{ background: "#fff", borderRadius: 16, padding: "40px 36px", maxWidth: 460, textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,.1)" }}>
          <div style={{ fontSize: "3.5rem", marginBottom: 14 }}>🔒</div>
          <h2 style={{ margin: "0 0 8px", color: "#0f172a", fontSize: "1.4rem" }}>Accès refusé</h2>
          <p style={{ color: "#64748b", fontSize: ".92rem", margin: "0 0 24px" }}>
            Cette page n'est pas accessible avec le rôle <strong style={{ color: "#dc2626" }}>{user.role}</strong>.<br />
            Vous serez redirigé vers votre espace.
          </p>
          <button
            onClick={() => { window.location.href = homeMap[user.role] || "/system"; }}
            style={{ padding: "12px 28px", background: "#1a3c5e", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, cursor: "pointer", fontSize: ".92rem" }}
            data-testid="back-home-btn"
          >
            ← Retour à mon espace
          </button>
        </div>
      </div>
    );
  }
  return children;
}
