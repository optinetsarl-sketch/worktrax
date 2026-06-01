import Layout from "../components/Layout";
import { API } from "../lib/api";

const SECTIONS = [
  { id: "intro", title: "1. Présentation", icon: "📋" },
  { id: "login", title: "2. Connexion", icon: "🔐", shot: "01-login.png" },
  { id: "roles", title: "3. Les 5 rôles", icon: "👥" },
  { id: "dashboard", title: "4. Tableau de bord Admin", icon: "📊", shot: "03-dashboard-admin.png" },
  { id: "workers", title: "5. Module Ouvriers", icon: "👷", shot: "04-ouvriers-liste.png" },
  { id: "enrollment", title: "6. Enrôlement biométrique", icon: "📷", shot: "07-ajout-ouvrier-etape2-visage.png" },
  { id: "equipment", title: "7. Engins (Camions / Machines)", icon: "🚜", shot: "09-engins-camions.png" },
  { id: "attendance", title: "8. Pointage biométrique automatique", icon: "📍", shot: "19-controleur-terminal.png" },
  { id: "fuel", title: "9. Terminal Pompiste", icon: "⛽", shot: "21-pompiste-initial.png" },
  { id: "rh", title: "10. Espace RH", icon: "🧑‍💼", shot: "23-rh-dashboard.png" },
  { id: "supervisor", title: "11. Espace Superviseur", icon: "👷‍♂️", shot: "24-superviseur-dashboard.png" },
  { id: "cameras", title: "12. Caméras IP", icon: "📹", shot: "13-cameras.png" },
  { id: "reports", title: "13. Rapports", icon: "📈", shot: "16-rapports.png" },
  { id: "users", title: "14. Gestion utilisateurs", icon: "👥", shot: "17-utilisateurs.png" },
  { id: "security", title: "15. Sécurité & conformité", icon: "🔒" },
  { id: "faq", title: "16. FAQ", icon: "❓" },
];

export default function Documentation() {
  return (
    <Layout title="Documentation utilisateur">
      <div className="role-banner" style={{ background: "linear-gradient(135deg,#0f2843,#2563a8)" }}>
        <div className="rb-icon">📘</div>
        <div>
          <h2>Guide utilisateur WORKTRAX</h2>
          <p>Documentation complète avec captures d'écran — version Mai 2026</p>
        </div>
        <div className="rb-right" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <a className="top-btn accent" href={`${API}/docs/guide.html`} target="_blank" rel="noopener noreferrer" data-testid="open-html-btn">📖 Lire en plein écran</a>
          <a className="top-btn ghost" style={{ background: "rgba(255,255,255,.1)", color: "#fff", borderColor: "rgba(255,255,255,.3)" }} href={`${API}/docs/bundle.zip`} download data-testid="download-zip-btn">📥 Télécharger (ZIP)</a>
          <a className="top-btn ghost" style={{ background: "rgba(255,255,255,.1)", color: "#fff", borderColor: "rgba(255,255,255,.3)" }} href={`${API}/docs/guide.md`} download data-testid="download-md-btn">📄 Markdown</a>
        </div>
      </div>

      <div className="grid-3">
        {SECTIONS.map((s) => (
          <div key={s.id} className="panel" style={{ cursor: s.shot ? "pointer" : "default", overflow: "hidden" }}>
            <div className="panel-header"><div><div className="panel-title">{s.icon} {s.title}</div></div></div>
            {s.shot ? (
              <a href={`${API}/docs/screenshots/${s.shot}`} target="_blank" rel="noopener noreferrer">
                <img
                  src={`${API}/docs/screenshots/${s.shot}`}
                  alt={s.title}
                  style={{ width: "100%", borderRadius: 8, border: "1px solid #e2e8f0", display: "block" }}
                  data-testid={`shot-${s.id}`}
                />
              </a>
            ) : (
              <div style={{ padding: 20, textAlign: "center", color: "#64748b", fontSize: ".85rem", background: "#f8fafc", borderRadius: 8 }}>
                <div style={{ fontSize: "2.4rem", marginBottom: 6 }}>{s.icon}</div>
                Détails dans le guide complet
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="panel" style={{ marginTop: 18 }}>
        <div className="panel-header"><div><div className="panel-title">📞 Support OPTINET SARLU</div></div></div>
        <div style={{ fontSize: ".92rem", lineHeight: 1.8 }}>
          📞 <strong>+228 90 74 84 65</strong> / +228 99 05 84 71<br />
          📧 <strong>optinetsarl@gmail.com</strong><br />
          🌐 www.optinet.tg<br />
          📍 Lomé-Agoè Cacavéli, derrière la CEET, Togo
        </div>
      </div>
    </Layout>
  );
}
