export function Avatar({ initials, color }) {
  return <span className="avatar" style={{ background: color }}>{initials}</span>;
}
