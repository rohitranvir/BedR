import { NavLink } from 'react-router-dom';

function Navbar() {
  return (
    <nav className="navbar">
      <div className="nav-brand">BedR Admin</div>
      <NavLink to="/" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
        Dashboard
      </NavLink>
      <NavLink to="/flats" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
        Flats & Rooms
      </NavLink>
      <NavLink to="/tenants" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
        Tenants
      </NavLink>
    </nav>
  );
}

export default Navbar;
