import { useEffect, useState } from "react";
import http, { formatDateTime } from "../lib/api";
import Layout from "../components/Layout";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from "recharts";

export default function PompisteRapport() {
  const [period, setPeriod] = useState("month");
  const [fuel, setFuel] = useState([]);
  useEffect(() => {
    http.get("/fuel", { params: { period } }).then((r) => setFuel(r.data));
  }, [period]);

  const total = fuel.reduce((s, f) => s + f.liters, 0);
  const byPlate = Object.values(fuel.reduce((acc, f) => {
    if (!acc[f.plate]) acc[f.plate] = { plate: f.plate, name: f.equipment_name, chauffeur: f.chauffeur_name, liters: 0, count: 0, last: f.timestamp };
    acc[f.plate].liters += f.liters;
    acc[f.plate].count += 1;
    if (f.timestamp > acc[f.plate].last) acc[f.plate].last = f.timestamp;
    return acc;
  }, {})).sort((a, b) => b.liters - a.liters);

  const trucks = fuel.filter((f) => f.equipment_name && (f.equipment_name.toLowerCase().includes("camion") || f.equipment_name.toLowerCase().includes("citerne") || f.equipment_name.toLowerCase().includes("pick-up"))).reduce((s, f) => s + f.liters, 0);
  const machines = total - trucks;

  return (
    <Layout title="Rapport carburant">
      <div className="role-banner pompiste">
        <div className="rb-icon">📊</div>
        <div><h2>Rapport de consommation carburant</h2><p>Consommation par engin et intervalles de ravitaillement</p></div>
      </div>
      <div className="filter-bar" style={{ marginBottom: 16 }}>
        <button className={`filter-btn ${period === "today" ? "active" : ""}`} onClick={() => setPeriod("today")}>Aujourd'hui</button>
        <button className={`filter-btn ${period === "week" ? "active" : ""}`} onClick={() => setPeriod("week")}>Semaine</button>
        <button className={`filter-btn ${period === "month" ? "active" : ""}`} onClick={() => setPeriod("month")}>Mois</button>
        <button className={`filter-btn ${period === "all" ? "active" : ""}`} onClick={() => setPeriod("all")}>Tout</button>
      </div>
      <div className="kpi-grid">
        <div className="kpi-card orange"><div className="kpi-header"><div className="kpi-icon">⛽</div></div><div className="kpi-value">{total.toLocaleString("fr-FR")} L</div><div className="kpi-label">Total consommé</div></div>
        <div className="kpi-card blue"><div className="kpi-header"><div className="kpi-icon">🚛</div></div><div className="kpi-value">{byPlate.length}</div><div className="kpi-label">Engins ravitaillés</div></div>
        <div className="kpi-card green"><div className="kpi-header"><div className="kpi-icon">📋</div></div><div className="kpi-value">{fuel.length}</div><div className="kpi-label">Distributions</div></div>
        <div className="kpi-card red"><div className="kpi-header"><div className="kpi-icon">🔝</div></div><div className="kpi-value" style={{ fontSize: "1.05rem" }}>{byPlate[0]?.plate || "—"}</div><div className="kpi-label">Top consommateur</div><div className="kpi-sub">{byPlate[0]?.liters || 0} L</div></div>
      </div>
      <div className="grid-2">
        <div className="panel">
          <div className="panel-header"><div><div className="panel-title">📈 Top 8 engins consommateurs</div></div></div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={byPlate.slice(0, 8)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="plate" tick={{ fontSize: 10 }} width={100} />
              <Tooltip />
              <Bar dataKey="liters" fill="#f97316" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="panel">
          <div className="panel-header"><div><div className="panel-title">🍩 Camions vs Machines</div></div></div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={[{ name: "Camions", value: trucks }, { name: "Machines", value: machines }]} dataKey="value" nameKey="name" innerRadius={50} outerRadius={100} label>
                <Cell fill="#f97316" />
                <Cell fill="#2563a8" />
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ textAlign: "center", marginTop: 10 }}>
            <span style={{ marginRight: 20 }}><span style={{ color: "#f97316" }}>●</span> Camions : <strong>{trucks} L</strong></span>
            <span><span style={{ color: "#2563a8" }}>●</span> Machines : <strong>{machines} L</strong></span>
          </div>
        </div>
      </div>
      <div className="panel">
        <div className="panel-header"><div><div className="panel-title">🚛 Consommation par engin</div></div></div>
        <div className="scroll-x">
          <table className="data-table">
            <thead><tr><th>Plaque</th><th>Engin</th><th>Chauffeur</th><th>Total L</th><th>Nb ravit.</th><th>Dernier ravit.</th></tr></thead>
            <tbody>
              {byPlate.map((row) => (
                <tr key={row.plate}>
                  <td><strong>{row.plate}</strong></td>
                  <td>{row.name}</td>
                  <td>{row.chauffeur}</td>
                  <td>{row.liters} L</td>
                  <td>{row.count}</td>
                  <td>{formatDateTime(row.last)}</td>
                </tr>
              ))}
              {!byPlate.length && <tr><td colSpan={6} className="empty">Aucune donnée</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
