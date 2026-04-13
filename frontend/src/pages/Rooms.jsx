import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import { SkeletonCard } from '../components/Skeleton';
import SlideInPanel from '../components/SlideInPanel';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../components/ToastContext';

function CapacityBar({ beds, maxCapacity }) {
  const used = beds?.length || 0;
  const pct = maxCapacity > 0 ? Math.round((used / maxCapacity) * 100) : 0;
  const cls = pct >= 80 ? 'high' : pct >= 50 ? 'mid' : 'low';
  const clr = pct >= 80 ? 'var(--success)' : pct >= 50 ? 'var(--warning)' : 'var(--danger)';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
        <span>{used} / {maxCapacity} beds</span>
        <span style={{ fontWeight: 700, color: clr }}>{pct}% full</span>
      </div>
      <div className="progress-track">
        <div className={`progress-fill ${cls}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function Rooms() {
  const { id } = useParams(); // flat id
  const [flat, setFlat] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', max_capacity: '' });
  const [formErrors, setFormErrors] = useState({});
  const [deleteId, setDeleteId] = useState(null);
  const showToast = useToast();

  const fetchRooms = useCallback(() => {
    api.get(`/flats/${id}/rooms/`).then(res => { setRooms(res.data); setLoading(false); }).catch(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    api.get(`/flats/${id}/`).then(res => setFlat(res.data)).catch(() => {});
    fetchRooms();
  }, [id, fetchRooms]);

  const openPanel = () => {
    setFormData({ name: '', max_capacity: '' });
    setFormErrors({});
    setIsPanelOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Room name is required';
    if (!formData.max_capacity || formData.max_capacity < 1) errors.max_capacity = 'Capacity must be at least 1';
    if (Object.keys(errors).length) { setFormErrors(errors); return; }

    api.post(`/flats/${id}/rooms/`, { ...formData, max_capacity: parseInt(formData.max_capacity) })
      .then(res => {
        setRooms(prev => [...prev, res.data]);
        setIsPanelOpen(false);
        showToast('Room created successfully');
      })
      .catch(err => {
        if (err.response?.status === 400) setFormErrors(err.response.data);
        else showToast('Failed to create room', 'error');
      });
  };

  const confirmDelete = () => {
    api.delete(`/rooms/${deleteId}/`)
      .then(() => { setRooms(r => r.filter(x => x.id !== deleteId)); setDeleteId(null); showToast('Room deleted'); })
      .catch(err => {
        setDeleteId(null);
        showToast(err.response?.data?.detail || 'Cannot delete room with active tenants.', 'error');
      });
  };

  return (
    <div className="animate-page" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {deleteId && (
        <ConfirmDialog
          title="Delete Room"
          message="All beds in this room will be removed. Tenants must be unassigned first."
          onConfirm={confirmDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}

      {/* Breadcrumb + Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          <div className="breadcrumb">
            <Link to="/flats">Properties</Link>
            <span className="breadcrumb-sep">›</span>
            <span style={{ color: 'var(--text)' }}>{flat?.name || '...'}</span>
            <span className="breadcrumb-sep">›</span>
            <span>Rooms</span>
          </div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
            {flat ? flat.name : 'Loading...'} — Rooms
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {rooms.length} room{rooms.length !== 1 ? 's' : ''} configured
          </p>
        </div>
        <button className="btn-header" onClick={openPanel}>
          <span style={{ fontSize: '1rem', lineHeight: 1, marginRight: '2px' }}>+</span> Add Room
        </button>
      </div>

      {/* Cards */}
      <div className="room-cards-grid">
        {loading ? (
          [1,2,3].map(i => <SkeletonCard key={i} />)
        ) : rooms.length === 0 ? (
          <div className="glass-flat" style={{ gridColumn: '1/-1', borderRadius: 'var(--r-xl)' }}>
            <div className="empty-state">
              <div className="empty-icon-wrap">🚪</div>
              <div className="empty-title">No rooms yet</div>
              <div className="empty-sub">Add a room to define the bed capacity for this property.</div>
            </div>
          </div>
        ) : rooms.map(room => {
          const bedCount = room.beds?.length || 0;
          const occupied = room.beds?.filter(b => b.status === 'occupied').length || 0;
          return (
            <div key={room.id} className="glass room-card" style={{ borderRadius: 'var(--r-xl)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div className="room-card-name">{room.name}</div>
                  <div className="room-card-cap">Max {room.max_capacity} beds · {occupied} occupied</div>
                </div>
                <span className="pill blue">{bedCount}/{room.max_capacity}</span>
              </div>
              <CapacityBar beds={room.beds} maxCapacity={room.max_capacity} />
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                <Link to={`/rooms/${room.id}`} className="btn-action view" style={{ flex: 1, justifyContent: 'center' }}>
                  View Beds →
                </Link>
                <button className="btn-action danger" onClick={() => setDeleteId(room.id)}>Delete</button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Room Panel */}
      <SlideInPanel
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        title="Add New Room"
        subtitle={`Adding to: ${flat?.name || '...'}`}
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-group">
            <label className="form-label">Room Name</label>
            <input
              placeholder="e.g. Room 101, Master Suite"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className={formErrors.name ? 'error' : ''}
            />
            {formErrors.name && <div className="form-error">⚠ {formErrors.name}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">Maximum Bed Capacity</label>
            <input
              type="number"
              min="1"
              max="20"
              placeholder="e.g. 4"
              value={formData.max_capacity}
              onChange={e => setFormData({ ...formData, max_capacity: e.target.value })}
              className={formErrors.max_capacity ? 'error' : ''}
            />
            {formErrors.max_capacity && <div className="form-error">⚠ {formErrors.max_capacity}</div>}
          </div>

          <button type="submit" className="btn-primary">Save Room</button>
        </form>
      </SlideInPanel>
    </div>
  );
}
