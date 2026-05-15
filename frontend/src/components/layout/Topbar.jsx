import { PAGE_TITLES } from '../../config/roles.js';
import { useClock } from '../../hooks/useClock.js';

export function Topbar({ page }) {
  const { date, time } = useClock();
  return (
    <header className="topbar">
      <h1>{PAGE_TITLES[page] || page}</h1>
      <div className="topbar-meta">
        <span>{date} • {time}</span>
        <button type="button" className="notif">🔔</button>
      </div>
    </header>
  );
}
