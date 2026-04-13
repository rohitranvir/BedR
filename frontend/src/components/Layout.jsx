import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';

export default function Layout() {
  const location = useLocation();
  
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard';
    if (path.startsWith('/flats')) return 'Manage Properties';
    if (path.startsWith('/rooms')) return 'Advanced Configuration';
    if (path.startsWith('/tenants')) return 'Manage Tenants';
    return 'BedR Admin Desk';
  };

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div style={{ padding: '2rem 1.5rem', marginBottom: '1rem' }}>
          <h1 style={{ color: 'var(--accent)', fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.03em' }}>
            BedR<span style={{ color: '#fff' }}>.</span>
          </h1>
        </div>
        
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
          <NavLink to="/" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
            <span style={{ fontSize: '1.2rem', minWidth: '24px' }}>🏠</span> Dashboard
          </NavLink>
          <NavLink to="/flats" className={({isActive}) => isActive || location.pathname.includes('/rooms') ? "nav-link active" : "nav-link"}>
            <span style={{ fontSize: '1.2rem', minWidth: '24px' }}>🏢</span> Properties
          </NavLink>
          <NavLink to="/tenants" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
            <span style={{ fontSize: '1.2rem', minWidth: '24px' }}>👤</span> Tenants
          </NavLink>
        </nav>

        <div style={{ padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', borderTop: '1px solid var(--border)' }}>
          BedR v1.0
        </div>
      </aside>

      <main className="main-content">
        <header className="top-header">
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>{getPageTitle()}</h2>
        </header>
        <div className="animate-fade-in">
           <Outlet />
        </div>
      </main>
    </div>
  );
}
