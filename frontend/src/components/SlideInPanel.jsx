import React from 'react';

export default function SlideInPanel({ title, isOpen, onClose, children }) {
  if (!isOpen) return null;

  return (
    <>
      <div className="overlay" onClick={onClose} />
      <div className="slide-panel">
        <div className="slide-header">
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{title}</h2>
          <button 
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer', lineHeight: 1 }}
          >
            ✕
          </button>
        </div>
        <div className="slide-body">
          {children}
        </div>
      </div>
    </>
  );
}
