import { useEffect, useState } from "react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import http, { formatTime } from "../lib/api";
import Layout from "../components/Layout";

const COLORS = ["#16a34a", "#dc2626", "#f59e0b", "#7c3aed", "#0284c7"];

export default function Dashboard() {
  const [d, setD] = useState(null);
  useEffect(() => {
    http.get("/dashboard/admin").then((r) => setD(r.data));
  }, []);
  if (!d) return <Layout title="Tableau de bord"><div>Chargement…</div></Layout>;

  const statusData = [
    { name: "Présents", value: d.workers.present, c: "#16a34a" },
    { name: "Absents", value: d.workers.absent, c: "#dc2626" },
    { name: "Malades", value: d.workers.malade, c: "#f59e0b" },
    { name: "Congés", value: d.workers.conge, c: "#7c3aed" },
    { name: "Blessés", value: d.workers.blesse, c: "#991b1b" },
  ];

  return (
    <Layout title="Tableau de bord">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
        <div>
          <div style={{ fontSize: "1.45rem", fontWeight: 800 }}>Bonjour, Administrateur 👋</div>
          <div className="muted" style={{ fontSize: ".85rem", marginTop: 4 }}>Vue d'ensemble en temps réel — {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="top-btn ghost" data-testid="export-btn">📊 Exporter rapport</button>
          <button className="top-btn primary" onClick={() => window.location.reload()} data-testid="refresh-btn">🔄 Actualiser</button>
        </div>
      </div>

      <div className="kpi-grid" data-testid="kpi-grid">
        <div className="kpi-card blue">
          <div className="kpi-header"><div className="kpi-icon">👷</div><span className="kpi-trend up">↑ Multisites</span></div>
          <div className="kpi-value" data-testid="kpi-total-workers">{d.workers.total}</div>
          <div className="kpi-label">Total Ouvriers inscrits</div>
          <div className="kpi-sub">📍 {d.sites_active} chantiers actifs</div>
        </div>
        <div className="kpi-card green">
          <div className="kpi-header"><div className="kpi-icon">✅</div><span className="kpi-trend up">{d.workers.total ? Math.round(d.workers.present * 100 / d.workers.total) : 0}%</span></div>
          <div className="kpi-value" data-testid="kpi-present">{d.workers.present}</div>
          <div className="kpi-label">Présents aujourd'hui</div>
          <div className="kpi-sub">🔴 {d.workers.absent} absents</div>
        </div>
        <div className="kpi-card orange">
          <div className="kpi-header"><div className="kpi-icon">⏱️</div><span className="kpi-trend up">+4%</span></div>
          <div className="kpi-value">{d.total_hours_month.toLocaleString("fr-FR")}</div>
          <div className="kpi-label">Heures travaillées ce mois</div>
          <div className="kpi-sub">📅 Moy. 7.4 h/jour</div>
        </div>
        <div className="kpi-card red">
          <div className="kpi-header"><div className="kpi-icon">🚜</div><span className="kpi-trend up">{d.equipment.total ? Math.round(d.equipment.active * 100 / d.equipment.total) : 0}%</span></div>
          <div className="kpi-value">{d.equipment.active}/{d.equipment.total}</div>
          <div className="kpi-label">Engins en service</div>
          <div className="kpi-sub">⚠️ {d.equipment.maintenance} maintenance • {d.equipment.trucks} camions + {d.equipment.machines} machines</div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <div>
            <div className="panel-title">🔔 Contrats expirants (≤ 90 jours)</div>
            <div className="panel-subtitle">
              {d.contracts_expiring?.count || 0} contrat(s) à surveiller • {d.contracts_expiring?.urgent_count || 0} urgent(s)
            </div>
          </div>
        </div>
        <div className="scroll-x">
          <table className="data-table">
            <thead><tr><th>Ouvrier</th><th>Structure</th><th>Site</th><th>Contrat</th><th>Fin</th><th>Statut</th></tr></thead>
            <tbody>
              {(d.contracts_expiring?.items || []).slice(0, 8).map((item) => (
                <tr key={`${item.worker_id}-${item.contract_end}`}>
                  <td>{item.worker_name}</td>
                  <td>{item.structure || "—"}</td>
                  <td>{item.site || "—"}</td>
                  <td>{item.contract || "—"}</td>
                  <td>{item.contract_end}</td>
                  <td>
                    <span className={`badge ${item.days_left <= 30 ? "absent" : "warning"}`}>
                      {item.days_left < 0 ? `Expiré (${Math.abs(item.days_left)}j)` : `Expire dans ${item.days_left}j`}
                    </span>
                  </td>
                </tr>
              ))}
              {!(d.contracts_expiring?.items || []).length && (
                <tr><td colSpan={6} className="empty">Aucun contrat à échéance.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid-2">
        <div className="panel">
          <div className="panel-header">
            <div><div className="panel-title">📈 Productivité hebdomadaire</div><div className="panel-subtitle">Heures travaillées vs objectif</div></div>
          </div>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={d.productivity}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="hours" fill="#f97316" name="Heures réelles" radius={[6, 6, 0, 0]} />
              <Bar dataKey="target" fill="#2563a8" name="Objectif" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="panel">
          <div className="panel-header"><div><div className="panel-title">🚜 Utilisation engins par site</div><div className="panel-subtitle">Taux d'exploitation</div></div></div>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={d.sites_usage} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
              <YAxis dataKey="site" type="category" tick={{ fontSize: 11 }} width={80} />
              <Tooltip formatter={(v) => `${v}%`} />
              <Bar dataKey="rate" fill="#1a3c5e" radius={[0, 6, 6, 0]} name="Taux" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid-3">
        <div className="panel">
          <div className="panel-header"><div className="panel-title">📊 Statuts ouvriers</div></div>
          <ResponsiveContainer width="100%" height={170}>
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={70}>
                {statusData.map((s, i) => <Cell key={i} fill={s.c} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ marginTop: 10 }}>
            {statusData.map((s) => (
              <div className="stat-row" key={s.name}>
                <span className="stat-label"><span style={{ color: s.c }}>●</span> {s.name}</span>
                <span className="stat-value" style={{ color: s.c }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-header"><div className="panel-title">⚡ Activités récentes</div></div>
          <ul className="timeline">
            {d.activities.map((a, i) => (
              <li key={i}>
                <div className="tl-dot" style={{ background: a.type === "fuel" ? "#f97316" : "#16a34a" }} />
                <div>
                  <div className="tl-text">{a.text}</div>
                  <div className="tl-time">{formatTime(a.time)} • {a.site}</div>
                </div>
              </li>
            ))}
            {!d.activities.length && <div className="empty">Aucune activité</div>}
          </ul>
        </div>

        <div className="panel">
          <div className="panel-header"><div className="panel-title">👷 Répartition métiers</div></div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {d.categories.map((c, i) => {
              const max = d.categories[0]?.count || 1;
              const pct = Math.round((c.count / max) * 100);
              const colors = ["blue", "orange", "green", "red"];
              return (
                <div key={i}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: ".82rem" }}>{c.category}</span>
                    <span style={{ fontSize: ".82rem", fontWeight: 700 }}>{c.count}</span>
                  </div>
                  <div className="progress-bar">
                    <div className={`progress-fill ${colors[i % 4]}`} style={{ width: pct + "%" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Layout>
  );
}
