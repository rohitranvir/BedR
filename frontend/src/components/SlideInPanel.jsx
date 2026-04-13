export default function SlideInPanel({ isOpen, onClose, title, subtitle, children }) {
  if (!isOpen) return null;
  return (
    <>
      <div className="overlay" onClick={onClose} />
      <div className="slide-panel">
        <div className="slide-header">
          <div>
            <div className="slide-title">{title}</div>
            {subtitle && <div className="slide-subtitle">{subtitle}</div>}
          </div>
          <button className="slide-close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="slide-body">
          {children}
        </div>
      </div>
    </>
  );
}
