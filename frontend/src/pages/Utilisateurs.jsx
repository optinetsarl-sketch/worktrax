import { useEffect, useState } from "react";
import http, { SITES, formatDate } from "../lib/api";
import { useAuth } from "../lib/auth";
import Layout from "../components/Layout";

const ROLE_INFO = {
  super_admin: { label: "Super Admin IT", icon: "🖥️", color: "#7f1d1d" },
  admin: { label: "Administrateur", icon: "🛡️", color: "#1a3c5e" },
  superviseur: { label: "Superviseur", icon: "👷‍♂️", color: "#2563a8" },
  rh: { label: "RH", icon: "🧑‍💼", color: "#7c3aed" },
  controleur: { label: "Contrôleur", icon: "📱", color: "#0f766e" },
  pompiste: { label: "Pompiste", icon: "⛽", color: "#f97316" },
};

function ConfirmDialog({ title, message, confirmLabel = "Supprimer", onConfirm, onCancel }) {
  return (
    <div className="modal-overlay" onClick={onCancel} style={{ zIndex: 1100 }}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 420, padding: 0, overflow: "hidden" }}
      >
        {/* Header rouge */}
        <div style={{ background: "#dc2626", padding: "18px 24px", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ background: "rgba(255,255,255,0.2)", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem" }}>
            🗑
          </div>
          <h3 style={{ margin: 0, color: "#fff", fontSize: "1rem", fontWeight: 700 }}>{title}</h3>
        </div>
        {/* Corps */}
        <div style={{ padding: "20px 24px 10px" }}>
          <p style={{ margin: 0, color: "#374151", fontSize: ".9rem", lineHeight: 1.6 }}>{message}</p>
          <p style={{ margin: "10px 0 0", color: "#6b7280", fontSize: ".8rem" }}>
            Cette action est <strong>irréversible</strong>.
          </p>
        </div>
        {/* Boutons */}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", padding: "14px 24px 20px" }}>
          <button
            className="top-btn ghost"
            onClick={onCancel}
            style={{ minWidth: 100 }}
          >
            Annuler
          </button>
          <button
            className="top-btn"
            onClick={onConfirm}
            style={{ minWidth: 120, background: "#dc2626", color: "#fff", border: "none" }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Utilisateurs() {
  const { user } = useAuth();
  const [list, setList] = useState([]);
  const [filter, setFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirm, setConfirm] = useState(null); // { user, resolve }

  const load = () => http.get("/users").then((r) => setList(r.data));
  useEffect(() => { load(); }, []);

  const filtered = list.filter((u) => filter === "all" || u.role === filter);
  const byRole = (role) => list.filter((u) => u.role === role).length;

  const askConfirm = (u) =>
    new Promise((resolve) => setConfirm({ user: u, resolve }));

  const remove = async (u) => {
    const ok = await askConfirm(u);
    setConfirm(null);
    if (!ok) return;
    try {
      await http.delete(`/users/${u.id}`);
      load();
    } catch (e) {
      setConfirm({ error: e.response?.data?.detail || "Erreur de suppression" });
    }
  };

  return (
    <Layout title="Gestion des utilisateurs">
      {confirm && confirm.user && (
        <ConfirmDialog
          title="Supprimer l'utilisateur"
          message={`Voulez-vous vraiment supprimer « ${confirm.user.name} » (${ROLE_INFO[confirm.user.role]?.label || confirm.user.role}) ?`}
          confirmLabel="🗑 Supprimer"
          onConfirm={() => confirm.resolve(true)}
          onCancel={() => confirm.resolve(false)}
        />
      )}

      <div className="kpi-grid">
        <div className="kpi-card blue"><div className="kpi-header"><div className="kpi-icon">👥</div></div><div className="kpi-value">{list.length}</div><div className="kpi-label">Total utilisateurs</div></div>
        <div className="kpi-card purple"><div className="kpi-header"><div className="kpi-icon">🛡️</div></div><div className="kpi-value">{byRole("admin")}</div><div className="kpi-label">Administrateurs</div></div>
        <div className="kpi-card green"><div className="kpi-header"><div className="kpi-icon">👷‍♂️</div></div><div className="kpi-value">{byRole("superviseur")}</div><div className="kpi-label">Superviseurs</div></div>
        <div className="kpi-card orange"><div className="kpi-header"><div className="kpi-icon">📱</div></div><div className="kpi-value">{byRole("controleur") + byRole("pompiste") + byRole("rh")}</div><div className="kpi-label">RH / Contrôleurs / Pompistes</div></div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <div>
            <div className="panel-title">👥 Utilisateurs de la plateforme</div>
            <div className="panel-subtitle">{filtered.length} utilisateur{filtered.length > 1 ? "s" : ""}</div>
          </div>
          <div className="panel-actions">
            <div className="filter-bar">
              <button className={`filter-btn ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")}>Tous</button>
              <button className={`filter-btn ${filter === "superviseur" ? "active" : ""}`} onClick={() => setFilter("superviseur")}>Superviseurs</button>
              <button className={`filter-btn ${filter === "rh" ? "active" : ""}`} onClick={() => setFilter("rh")}>RH</button>
              <button className={`filter-btn ${filter === "controleur" ? "active" : ""}`} onClick={() => setFilter("controleur")}>Contrôleurs</button>
              <button className={`filter-btn ${filter === "pompiste" ? "active" : ""}`} onClick={() => setFilter("pompiste")}>Pompistes</button>
            </div>
            <button className="top-btn accent" onClick={() => setShowAdd(true)} data-testid="add-user-btn">+ Créer un utilisateur</button>
          </div>
        </div>
        <div className="scroll-x">
          <table className="data-table" data-testid="users-table">
            <thead>
              <tr><th>Utilisateur</th><th>Email</th><th>Rôle</th><th>Site</th><th>Créé le</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filtered.map((u) => {
                const info = ROLE_INFO[u.role] || { label: u.role, icon: "👤", color: "#64748b" };
                const initials = u.name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();
                return (
                  <tr key={u.id} data-testid={`user-row-${u.id}`}>
                    <td>
                      <div className="worker-info">
                        <div className="worker-avatar" style={{ background: info.color }}>{initials}</div>
                        <div>
                          <div className="name">{u.name}</div>
                          <div className="meta">{u.id === user.id ? "👤 Vous" : "—"}</div>
                        </div>
                      </div>
                    </td>
                    <td>{u.email}</td>
                    <td><span className="badge" style={{ background: info.color + "20", color: info.color }}>{info.icon} {info.label}</span></td>
                    <td>{u.role === "controleur" ? (u.assigned_site || u.site || "—") : (u.site || "—")}</td>
                    <td>{formatDate(u.created_at)}</td>
                    <td>
                      {u.role !== "super_admin" && (u.role !== "admin" || user.role === "super_admin") && u.id !== user.id && (
                        <div style={{ display: "flex", gap: 6 }}>
                          <button className="top-btn ghost" style={{ padding: "4px 10px", fontSize: ".75rem" }} onClick={() => setEditing(u)} data-testid={`edit-${u.id}`}>✏️ Modifier</button>
                          <button className="top-btn ghost" style={{ padding: "4px 10px", fontSize: ".75rem", color: "#dc2626", borderColor: "#dc2626" }} onClick={() => remove(u)} data-testid={`delete-${u.id}`}>🗑 Supprimer</button>
                        </div>
                      )}
                      {u.role === "super_admin" && <span className="muted" style={{ fontSize: ".75rem" }}>🔒 IT Protégé</span>}
                      {u.role === "admin" && user.role !== "super_admin" && <span className="muted" style={{ fontSize: ".75rem" }}>🔒 Protégé</span>}
                      {u.id === user.id && <span className="muted" style={{ fontSize: ".75rem" }}>👤 Vous</span>}
                    </td>
                  </tr>
                );
              })}
              {!filtered.length && <tr><td colSpan={6} className="empty">Aucun utilisateur</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {showAdd && <UserModal onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); load(); }} />}
      {editing && <UserModal user={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
    </Layout>
  );
}

function UserModal({ user, onClose, onSaved }) {
  const { user: currentUser } = useAuth();
  const isEdit = !!user;
  const [form, setForm] = useState({
    email: user?.email || "",
    name: user?.name || "",
    password: "",
    role: user?.role || "superviseur",
    site: user?.site || "",
    assigned_site: user?.assigned_site || user?.site || "",
    worker_id: user?.worker_id || "",
  });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [workers, setWorkers] = useState([]);
  const upd = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    http.get("/workers").then((r) => setWorkers(r.data)).catch(() => {});
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      if (isEdit) {
        const payload = { name: form.name, role: form.role, site: form.site, assigned_site: form.assigned_site, worker_id: form.worker_id };
        if (form.password) payload.password = form.password;
        await http.patch(`/users/${user.id}`, payload);
      } else {
        await http.post("/users", form);
      }
      onSaved();
    } catch (ex) {
      const d = ex.response?.data?.detail;
      setErr(typeof d === "string" ? d : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} data-testid="user-modal">
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEdit ? `✏️ Modifier ${user.name}` : "+ Créer un utilisateur"}</h2>
          <div className="modal-close" onClick={onClose}>×</div>
        </div>
        <form onSubmit={submit}>
          <div className="form-grid">
            <div>
              <label className="form-label">Nom complet *</label>
              <input className="form-input" required value={form.name} onChange={(e) => upd("name", e.target.value)} data-testid="user-name" placeholder="Ex: Marc Doussou" />
            </div>
            <div>
              <label className="form-label">Email *</label>
              <input className="form-input" type="email" required value={form.email} disabled={isEdit} onChange={(e) => upd("email", e.target.value)} data-testid="user-email" placeholder="ex: marc@optinet.tg" />
            </div>
            <div>
              <label className="form-label">Mot de passe {isEdit ? "(laisser vide pour ne pas changer)" : "*"}</label>
              <input className="form-input" type="text" required={!isEdit} value={form.password} onChange={(e) => upd("password", e.target.value)} data-testid="user-password" placeholder="Mot de passe initial" />
            </div>
            <div>
              <label className="form-label">Rôle *</label>
              <select
                className="form-input"
                value={form.role}
                onChange={(e) => {
                  const nextRole = e.target.value;
                  upd("role", nextRole);
                  if (nextRole === "controleur") {
                    const siteValue = form.assigned_site || form.site;
                    upd("assigned_site", siteValue);
                    upd("site", siteValue);
                  }
                }}
                data-testid="user-role"
              >
                {currentUser?.role === "super_admin" && <option value="admin">🛡️ Administrateur</option>}
                <option value="superviseur">👷‍♂️ Superviseur</option>
                <option value="rh">🧑‍💼 RH</option>
                <option value="controleur">📱 Contrôleur</option>
                <option value="pompiste">⛽ Pompiste</option>
              </select>
            </div>
            <div style={{ gridColumn: "span 2" }}>
              <label className="form-label">Lier à un ouvrier (optionnel)</label>
              <select
                className="form-input"
                value={form.worker_id}
                onChange={(e) => {
                  const wid = e.target.value;
                  upd("worker_id", wid);
                  if (wid) {
                    const w = workers.find((x) => x.id === wid);
                    if (w && !form.name) upd("name", w.name);
                  }
                }}
              >
                <option value="">— Aucun ouvrier lié —</option>
                {workers.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} — {w.category} · {w.site}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ gridColumn: "span 2" }}>
              <label className="form-label">
                {form.role === "controleur" ? "Chantier assigné (obligatoire)" : "Chantier (optionnel)"}
              </label>
              <select
                className="form-input"
                value={form.role === "controleur" ? form.assigned_site : form.site}
                onChange={(e) => {
                  if (form.role === "controleur") {
                    upd("assigned_site", e.target.value);
                    upd("site", e.target.value);
                  } else {
                    upd("site", e.target.value);
                  }
                }}
                required={form.role === "controleur"}
              >
                <option value="">— Tous les sites —</option>
                {SITES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          {err && <div className="login-error" style={{ marginTop: 12 }}>⚠️ {err}</div>}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 18 }}>
            <button type="button" className="top-btn ghost" onClick={onClose}>Annuler</button>
            <button type="submit" className="top-btn accent" disabled={busy} data-testid="user-submit">{busy ? "..." : isEdit ? "✓ Mettre à jour" : "✓ Créer"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
