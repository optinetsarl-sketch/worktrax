import axios from "axios";

export const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const http = axios.create({ baseURL: API });

http.interceptors.request.use((config) => {
  const t = localStorage.getItem("wt_token");
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

http.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("wt_token");
      localStorage.removeItem("wt_user");
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

export default http;

export const ROLE_LABEL = {
  super_admin: "Super Administrateur IT",
  admin: "Administrateur",
  superviseur: "Superviseur",
  rh: "Ressources Humaines",
  controleur: "Contrôleur",
  pompiste: "Pompiste",
};

export const SITES = ["Lomé-Agoè", "Kégué", "Baguida", "Adéwui", "Tsévié"];
export const STRUCTURES = ["EBOMAF", "Cabinet AGBO", "KOFFI BTP", "SODJI", "AMEGAH"];
export const CATEGORIES = [
  { name: "Tous", icon: "👥" },
  { name: "Maçon", icon: "🧱" },
  { name: "Manœuvre", icon: "🔧" },
  { name: "Électricien", icon: "⚡" },
  { name: "Conducteur", icon: "🚜" },
  { name: "Ferrailleur", icon: "🔩" },
  { name: "Plombier", icon: "🔧" },
  { name: "Peintre", icon: "🎨" },
  { name: "Pompiste", icon: "⛽" },
  { name: "Informaticien", icon: "💻" },
];
export const STATUS_LABEL = {
  present: "Présent",
  absent: "Absent",
  malade: "Malade",
  conge: "Congé",
  blesse: "Blessé",
};

export function formatTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}
export function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}
export function formatDateTime(iso) {
  if (!iso) return "—";
  return `${formatDate(iso)} ${formatTime(iso)}`;
}
export function fmtMoney(n) {
  if (n == null) return "—";
  return n.toLocaleString("fr-FR") + " FCFA";
}

export function formatDistanceKm(v) {
  if (v == null || Number.isNaN(v)) return "—";
  return `${Number(v).toFixed(2)} km`;
}
