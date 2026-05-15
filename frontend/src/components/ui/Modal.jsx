export function Modal({ open, title, children, onClose, width = 760 }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal" style={{ width }}>
        <header className="modal-header">
          <h3>{title}</h3>
          <button type="button" className="modal-close" onClick={onClose}>×</button>
        </header>
        {children}
      </section>
    </div>
  );
}
