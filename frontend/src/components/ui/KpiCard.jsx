export function KpiCard({ icon, value, label, sub, tone = 'blue', trend }) {
  return (
    <article className={`kpi-card ${tone}`}>
      <div className="kpi-top">
        <span className="kpi-icon">{icon}</span>
        {trend ? <span className="kpi-trend">{trend}</span> : null}
      </div>
      <strong>{value}</strong>
      <p>{label}</p>
      {sub ? <small>{sub}</small> : null}
    </article>
  );
}
