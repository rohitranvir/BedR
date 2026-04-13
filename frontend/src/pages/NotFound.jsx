import React from 'react';
import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <div className="animate-fade-in" style={{ textAlign: 'center', paddingTop: '10vh' }}>
      <h1 className="page-title" style={{ fontSize: '4rem', marginBottom: '1rem' }}>404</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', marginBottom: '2rem' }}>The page you are looking for does not exist.</p>
      <Link to="/" style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', background: 'var(--accent)', color: '#fff', textDecoration: 'none', fontWeight: 600 }}>
        Return to Dashboard
      </Link>
    </div>
  );
}

export default NotFound;
