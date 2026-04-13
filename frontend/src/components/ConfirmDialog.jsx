import React from 'react';

export default function ConfirmDialog({ message, onConfirm, onCancel }) {
  if (!message) return null;

  return (
    <div className="overlay" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div className="card" style={{ maxWidth: '400px', width: '90%', textAlign: 'center', animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
        <div style={{ fontSize: '3rem', color: 'var(--danger)', marginBottom: '1rem', lineHeight: 1 }}>
          ⚠️
        </div>
        <h3 style={{ marginBottom: '2rem', color: '#fff', fontWeight: 600, fontSize: '1.25rem' }}>{message}</h3>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button 
            onClick={onCancel}
            style={{ padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-sm)', background: 'transparent', color: 'var(--text-main)', border: '1px solid var(--border)', cursor: 'pointer', fontWeight: 600, flex: 1 }}
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            style={{ padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-sm)', background: 'var(--danger)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, flex: 1 }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
