import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { SkeletonCard } from '../components/Skeleton';
import SlideInPanel from '../components/SlideInPanel';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../components/ToastContext';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const TILES = {
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics',
    label: '🛰 Satellite',
  },
  street: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
    label: '🗺 Street',
  },
};

// flies the map to a given position and drops the pin there
function FlyTo({ target }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo(target, 16, { duration: 1.2 });
  }, [target, map]);
  return null;
}

function MapPicker({ pin, setPin }) {
  useMapEvents({
    click(e) { setPin([e.latlng.lat, e.latlng.lng]); }
  });
  return pin ? <Marker position={pin} /> : null;
}

function OccupancyPill({ rooms }) {
  const totalBeds = rooms.reduce((a, r) => a + (r.beds?.length || 0), 0);
  const occupiedBeds = rooms.reduce((a, r) => a + (r.beds?.filter(b => b.status === 'occupied').length || 0), 0);
  const pct = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;
  const colorClass = pct >= 70 ? 'high' : pct >= 40 ? 'mid' : 'low';
  const colors = { high: 'var(--success)', mid: 'var(--warning)', low: 'var(--danger)' };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
        <span>Occupancy</span>
        <span style={{ fontWeight: 700, color: colors[colorClass] }}>{pct}%</span>
      </div>
      <div className="progress-track">
        <div className={`progress-fill ${colorClass}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/* ── Map toolbar component (search + live location + tile toggle) ── */
function MapToolbar({ pin, setPin, flyTarget, setFlyTarget, tileMode, setTileMode }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const debounceRef = useRef(null);

  // debounced Nominatim search — fires 500ms after the user stops typing
  const handleSearch = useCallback((val) => {
    setQuery(val);
    clearTimeout(debounceRef.current);
    if (!val.trim()) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(val)}&limit=5`,
          { headers: { 'Accept-Language': 'en' } }
        );
        const data = await res.json();
        setResults(data);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 500);
  }, []);

  const pickResult = (r) => {
    const pos = [parseFloat(r.lat), parseFloat(r.lon)];
    setPin(pos);
    setFlyTarget(pos);
    setQuery(r.display_name.split(',').slice(0, 2).join(','));
    setResults([]);
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = [pos.coords.latitude, pos.coords.longitude];
        setPin(coords);
        setFlyTarget(coords);
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.5rem' }}>
      {/* Search row */}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        {/* search box */}
        <div style={{ flex: 1, position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '0.55rem 0.85rem' }}>
            <span style={{ fontSize: '0.9rem', flexShrink: 0 }}>🔍</span>
            <input
              style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--text)', fontSize: '0.82rem', width: '100%', padding: 0 }}
              placeholder="Search location…"
              value={query}
              onChange={e => handleSearch(e.target.value)}
            />
            {searching && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 0.8s linear infinite', flexShrink: 0 }}>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                <circle cx="12" cy="12" r="10" stroke="rgba(109,40,217,0.3)" strokeWidth="2.5"/>
                <path d="M12 2a10 10 0 0 1 10 10" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            )}
          </div>

          {/* Dropdown suggestions */}
          {results.length > 0 && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 4px)',
              left: 0, right: 0,
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-md)',
              zIndex: 9999,
              overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            }}>
              {results.map((r, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => pickResult(r)}
                  style={{
                    width: '100%', textAlign: 'left', padding: '0.6rem 0.85rem',
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    borderBottom: i < results.length - 1 ? '1px solid var(--border)' : 'none',
                    fontSize: '0.78rem', color: 'var(--text-sec)', fontFamily: 'inherit',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(109,40,217,0.1)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <span style={{ fontSize: '0.7rem', marginRight: '0.4rem' }}>📍</span>
                  {r.display_name.length > 70 ? r.display_name.slice(0, 70) + '…' : r.display_name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Live location button */}
        <button
          type="button"
          onClick={useMyLocation}
          title="Use my current location"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem',
            padding: '0.55rem 0.9rem',
            background: locating ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.1)',
            border: '1px solid rgba(16,185,129,0.25)',
            borderRadius: 'var(--r-md)',
            color: 'var(--success)',
            cursor: locating ? 'not-allowed' : 'pointer',
            fontSize: '0.78rem', fontWeight: 600,
            transition: 'all 0.2s',
            whiteSpace: 'nowrap',
            fontFamily: 'inherit',
          }}
        >
          {locating ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 0.8s linear infinite' }}>
              <circle cx="12" cy="12" r="10" stroke="rgba(16,185,129,0.3)" strokeWidth="2.5"/>
              <path d="M12 2a10 10 0 0 1 10 10" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          ) : '📡'} {locating ? 'Locating…' : 'My Location'}
        </button>

        {/* Satellite / Street toggle */}
        <button
          type="button"
          onClick={() => setTileMode(m => m === 'satellite' ? 'street' : 'satellite')}
          title="Switch map style"
          style={{
            display: 'flex', alignItems: 'center', gap: '0.35rem',
            padding: '0.55rem 0.9rem',
            background: tileMode === 'satellite' ? 'rgba(109,40,217,0.15)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${tileMode === 'satellite' ? 'rgba(109,40,217,0.35)' : 'var(--border)'}`,
            borderRadius: 'var(--r-md)',
            color: tileMode === 'satellite' ? 'var(--accent-light)' : 'var(--text-sec)',
            cursor: 'pointer',
            fontSize: '0.78rem', fontWeight: 600,
            transition: 'all 0.2s',
            whiteSpace: 'nowrap',
            fontFamily: 'inherit',
          }}
        >
          {tileMode === 'satellite' ? '🛰 Satellite' : '🗺 Street'}
        </button>
      </div>
    </div>
  );
}

export default function Flats() {
  const [flats, setFlats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', address: '', commission_rate: '' });
  const [formErrors, setFormErrors] = useState({});
  const [deleteId, setDeleteId] = useState(null);
  const [pin, setPin] = useState(null);
  const [flyTarget, setFlyTarget] = useState(null);
  const [tileMode, setTileMode] = useState('satellite');
  const showToast = useToast();

  useEffect(() => { fetchFlats(); }, []);

  const fetchFlats = () => {
    api.get('/flats/').then(res => { setFlats(res.data); setLoading(false); }).catch(() => setLoading(false));
  };

  const openPanel = () => {
    setFormData({ name: '', address: '', commission_rate: '' });
    setFormErrors({});
    setPin(null);
    setFlyTarget(null);
    setTileMode('satellite');
    setIsPanelOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Property name is required';
    if (!formData.address.trim()) errors.address = 'Address is required';
    if (Object.keys(errors).length) { setFormErrors(errors); return; }

    const payload = { ...formData, commission_rate: formData.commission_rate || 0 };
    if (pin) { payload.lat = pin[0]; payload.lng = pin[1]; }

    api.post('/flats/', payload)
      .then(res => {
        setFlats(prev => [...prev, res.data]);
        setIsPanelOpen(false);
        showToast('Property added successfully');
      })
      .catch(err => {
        if (err.response?.status === 400) setFormErrors(err.response.data);
        else showToast('Failed to create property', 'error');
      });
  };

  const confirmDelete = () => {
    api.delete(`/flats/${deleteId}/`)
      .then(() => { setFlats(f => f.filter(x => x.id !== deleteId)); setDeleteId(null); showToast('Property deleted'); })
      .catch(err => {
        setDeleteId(null);
        const msg = err.response?.data?.detail || 'Cannot delete — active tenants exist.';
        showToast(msg, 'error');
      });
  };

  const tile = TILES[tileMode];

  return (
    <div className="animate-page" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {deleteId && (
        <ConfirmDialog
          title="Delete Property"
          message="This will permanently delete the flat and all its rooms and beds. Active tenants must be unassigned first."
          onConfirm={confirmDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.03em' }}>Properties</h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            {loading ? '—' : `${flats.length} registered propert${flats.length !== 1 ? 'ies' : 'y'}`}
          </p>
        </div>
        <button className="btn-header" onClick={openPanel}>
          <span style={{ fontSize: '1rem', lineHeight: 1, marginRight: '2px' }}>+</span> Add Property
        </button>
      </div>

      {/* CARDS GRID */}
      <div className="cards-grid">
        {loading ? (
          [1,2,3].map(i => <SkeletonCard key={i} />)
        ) : flats.length === 0 ? (
          <div className="glass-flat" style={{ gridColumn: '1/-1', borderRadius: 'var(--r-xl)' }}>
            <div className="empty-state">
              <div className="empty-icon-wrap">🏢</div>
              <div className="empty-title">No properties yet</div>
              <div className="empty-sub">Click "Add Property" to register your first flat with its location on the map.</div>
            </div>
          </div>
        ) : flats.map(flat => (
          <div key={flat.id} className="glass prop-card" style={{ borderRadius: 'var(--r-xl)' }}>
            <div className="prop-card-header">
              <div className="prop-card-icon">🏢</div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.2rem' }}>
                <span className="pill purple">{flat.rooms?.length || 0} rooms</span>
                <span className="pill blue">{flat.commission_rate}% fee</span>
              </div>
            </div>
            <div>
              <div className="prop-card-name">{flat.name}</div>
              <div className="prop-card-address">{flat.address}</div>
            </div>

            {flat.lat && flat.lng && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                <span>📍</span>
                <span>{flat.lat.toFixed(4)}, {flat.lng.toFixed(4)}</span>
              </div>
            )}

            <OccupancyPill rooms={flat.rooms || []} />

            <div className="prop-card-footer">
              <Link to={`/flats/${flat.id}`} className="btn-action view">
                View Rooms →
              </Link>
              <button className="btn-action danger" onClick={() => setDeleteId(flat.id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ADD FLAT PANEL */}
      <SlideInPanel
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        title="Add New Property"
        subtitle="Search or click the map to set the location"
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-group">
            <label className="form-label">Property Name</label>
            <input
              placeholder="e.g. Skyline Apartments"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className={formErrors.name ? 'error' : ''}
            />
            {formErrors.name && <div className="form-error">⚠ {formErrors.name}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">Full Address</label>
            <input
              placeholder="e.g. 123 MG Road, Bengaluru"
              value={formData.address}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
              className={formErrors.address ? 'error' : ''}
            />
            {formErrors.address && <div className="form-error">⚠ {formErrors.address}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">Agency Commission Rate (%)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              placeholder="e.g. 10"
              value={formData.commission_rate}
              onChange={e => setFormData({ ...formData, commission_rate: e.target.value })}
              className={formErrors.commission_rate ? 'error' : ''}
            />
            {formErrors.commission_rate && <div className="form-error">⚠ {formErrors.commission_rate}</div>}
          </div>

          {/* MAP */}
          <div className="form-group">
            <label className="form-label">Pin Location on Map</label>

            <MapToolbar
              pin={pin}
              setPin={setPin}
              flyTarget={flyTarget}
              setFlyTarget={setFlyTarget}
              tileMode={tileMode}
              setTileMode={setTileMode}
            />

            <div style={{ height: 280, borderRadius: 'var(--r-lg)', overflow: 'hidden', position: 'relative' }}>
              <MapContainer
                center={[20.5937, 78.9629]}
                zoom={5}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer key={tileMode} url={tile.url} attribution={tile.attribution} maxZoom={19} />
                <MapPicker pin={pin} setPin={setPin} />
                <FlyTo target={flyTarget} />
              </MapContainer>

              {/* tile mode badge overlaid on map */}
              <div style={{
                position: 'absolute', bottom: 8, left: 8, zIndex: 999,
                background: 'rgba(2,2,7,0.75)', backdropFilter: 'blur(8px)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--r-full)',
                padding: '0.2rem 0.6rem',
                fontSize: '0.65rem', fontWeight: 600,
                color: 'var(--text-muted)',
                pointerEvents: 'none',
              }}>
                {tileMode === 'satellite' ? '🛰 Satellite View' : '🗺 Street View'}
              </div>
            </div>

            {pin ? (
              <div style={{ fontSize: '0.72rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                ✓ Pinned at {pin[0].toFixed(5)}, {pin[1].toFixed(5)}
              </div>
            ) : (
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                🖱 Click anywhere on the map to drop a pin
              </div>
            )}
          </div>

          <button type="submit" className="btn-primary">
            Save Property
          </button>
        </form>
      </SlideInPanel>
    </div>
  );
}
