import { useEffect, useState } from "react";
import http from "../lib/api";
import Layout from "../components/Layout";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";

export default function Rapports() {
  const [d, setD] = useState(null);
  const [fuel, setFuel] = useState([]);
  useEffect(() => {
    http.get("/dashboard/admin").then((r) => setD(r.data));
    http.get("/fuel", { params: { period: "month" } }).then((r) => setFuel(r.data));
  }, []);
  if (!d) return <Layout title="Rapports"><div>Chargement…</div></Layout>;
  const cats = d.categories.map((c) => ({ name: c.category, value: c.count }));
  const COLORS = ["#f97316", "#1a3c5e", "#16a34a", "#dc2626", "#7c3aed", "#0284c7", "#f59e0b", "#0f766e"];
  return (
    <Layout title="Rapports">
      <div className="grid-2">
        <div className="panel">
          <div className="panel-header"><div><div className="panel-title">📊 Heures par catégorie</div></div></div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={d.categories}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" angle={-30} textAnchor="end" height={60} tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#f97316" radius={[6, 6, 0, 0]} name="Ouvriers" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="panel">
          <div className="panel-header"><div><div className="panel-title">🥧 Répartition métiers</div></div></div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={cats} dataKey="value" nameKey="name" outerRadius={100} label>
                {cats.map((c, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="panel">
        <div className="panel-header"><div><div className="panel-title">⛽ Consommation carburant — mois</div><div className="panel-subtitle">{fuel.length} distributions • {fuel.reduce((s, f) => s + f.liters, 0)} L</div></div></div>
        <div className="scroll-x">
          <table className="data-table">
            <thead><tr><th>Plaque</th><th>Engin</th><th>Total Litres</th><th>Nb ravitaillements</th></tr></thead>
            <tbody>
              {Object.values(fuel.reduce((acc, f) => {
                if (!acc[f.plate]) acc[f.plate] = { plate: f.plate, name: f.equipment_name, liters: 0, count: 0 };
                acc[f.plate].liters += f.liters;
                acc[f.plate].count += 1;
                return acc;
              }, {})).sort((a, b) => b.liters - a.liters).map((row) => (
                <tr key={row.plate}><td><strong>{row.plate}</strong></td><td>{row.name}</td><td>{row.liters} L</td><td>{row.count}</td></tr>
              ))}
              {!fuel.length && <tr><td colSpan={4} className="empty">Aucune donnée</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
