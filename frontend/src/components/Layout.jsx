import React, { useState, Suspense, memo } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';

const NavIcon = memo(({ type }) => {
  const icons = {
    dashboard: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
        <rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>
      </svg>
    ),
    properties: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 21h18M5 21V7l7-4 7 4v14"/><path d="M9 21v-6h6v6"/>
      </svg>
    ),
    tenants: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  };
  return <span className="nav-icon">{icons[type]}</span>;
});

function PageLoader() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '300px', width: '100%' }}>
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <circle cx="12" cy="12" r="10" stroke="rgba(109,40,217,0.2)" strokeWidth="3"/>
        <path d="M12 2a10 10 0 0 1 10 10" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round"/>
      </svg>
    </div>
  );
}

const MemoizedSidebar = memo(({ isSidebarOpen, setIsSidebarOpen, isOnProperties }) => (
  <>
    {/* Sidebar Overlay for Mobile */}
    <div 
      className={`sidebar-overlay ${isSidebarOpen ? 'show' : ''}`} 
      onClick={() => setIsSidebarOpen(false)}
    ></div>

    {/* Sidebar */}
    <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
      <div className="sidebar-logo">
        <div className="logo-icon">🏠</div>
        <div>
          <div className="logo-text">BedR</div>
          <div className="logo-version">Property Suite v2</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Main Menu</div>

        <NavLink to="/" end className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} onClick={() => setIsSidebarOpen(false)}>
          <NavIcon type="dashboard" />
          Dashboard
        </NavLink>

        <NavLink
          to="/flats"
          className={isOnProperties ? 'nav-link active' : 'nav-link'}
          onClick={() => setIsSidebarOpen(false)}
          onMouseEnter={() => import('../pages/Flats')}
        >
          <NavIcon type="properties" />
          Properties
        </NavLink>

        <NavLink to="/tenants" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} onClick={() => setIsSidebarOpen(false)} onMouseEnter={() => import('../pages/Tenants')}>
          <NavIcon type="tenants" />
          Tenants
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-status">
          <div className="status-dot" />
          <span>Connected to Supabase</span>
        </div>
      </div>
    </aside>
  </>
));

const MemoizedTopBar = memo(({ meta, now, toggleSidebar }) => (
  <header className="top-bar">
    <div className="top-bar-left">
      <button className="hamburger-btn" onClick={() => toggleSidebar()}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>
      <div className="page-header-text hide-on-desktop">
        <div className="page-title">{meta.title}</div>
        <div className="breadcrumb">
          <span>{meta.sub}</span>
        </div>
      </div>
    </div>
    <div className="top-bar-right">
      <div className="date-badge">
        {now}
      </div>
    </div>
  </header>
));

export default function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const isOnProperties = location.pathname.startsWith('/flats') || location.pathname.startsWith('/rooms');

  const getPageMeta = () => {
    const path = location.pathname;
    if (path === '/') return { title: 'Dashboard', sub: 'Overview & analytics' };
    if (path.startsWith('/flats') && path.split('/').length === 2) return { title: 'Properties', sub: 'Manage your flats' };
    if (path.startsWith('/flats') && path.split('/').length > 2) return { title: 'Rooms', sub: 'Manage rooms in flat' };
    if (path.startsWith('/rooms')) return { title: 'Beds', sub: 'Manage beds in room' };
    if (path.startsWith('/tenants')) return { title: 'Tenants', sub: 'Manage residents' };
    return { title: 'BedR', sub: '' };
  };

  const meta = getPageMeta();
  const now = new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

  return (
    <div className="app-layout">
      <MemoizedSidebar 
        isSidebarOpen={isSidebarOpen} 
        setIsSidebarOpen={setIsSidebarOpen} 
        isOnProperties={isOnProperties} 
      />

      {/* Main */}
      <main className="main-content">
        <MemoizedTopBar meta={meta} now={now} toggleSidebar={() => setIsSidebarOpen(true)} />

        <div className="page-content animate-page">
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
