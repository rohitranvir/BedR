import React from 'react';

function ErrorMessage({ message, onDismiss }) {
  if (!message) return null;
  return (
    <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', color: 'var(--danger)', padding: '1rem', borderRadius: '8px', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div><strong>Error: </strong> {message}</div>
      {onDismiss && (
        <button onClick={onDismiss} style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontWeight: 'bold', padding: '0 0.5rem', fontSize: '1.2rem', lineHeight: 1 }}>✕</button>
      )}
    </div>
  );
}

export default ErrorMessage;
