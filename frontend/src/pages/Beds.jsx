import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import { SkeletonCard } from '../components/Skeleton';
import SlideInPanel from '../components/SlideInPanel';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../components/ToastContext';

const STATUS_META = {
  available: { label: 'Available', cls: 'available', icon: '✓' },
  occupied: { label: 'Occupied', cls: 'occupied', icon: '●' },
  maintenance: { label: 'Maintenance', cls: 'maintenance', icon: '⚙' },
};

export default function Beds() {
  const { id } = useParams(); // room id
  const [room, setRoom] = useState(null);
  const [flat, setFlat] = useState(null);
  const [beds, setBeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', price: '' });
  const [formErrors, setFormErrors] = useState({});
  const [deleteId, setDeleteId] = useState(null);
  const showToast = useToast();

  const fetchBeds = useCallback(() => {
    api.get(`/rooms/${id}/beds/`).then(res => { setBeds(res.data); setLoading(false); }).catch(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    api.get(`/rooms/${id}/`).then(res => {
      setRoom(res.data);
      if (res.data.flat) api.get(`/flats/${res.data.flat}/`).then(r => setFlat(r.data)).catch(() => {});
    }).catch(() => {});
    fetchBeds();
  }, [id, fetchBeds]);

  const openPanel = () => {
    setFormData({ name: '', price: '' });
    setFormErrors({});
    setIsPanelOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) { setFormErrors({ name: 'Bed name is required' }); return; }
    if (!formData.price || isNaN(formData.price)) { setFormErrors({ price: 'Valid price is required' }); return; }
    api.post(`/rooms/${id}/beds/`, formData)
      .then(res => { setBeds(prev => [...prev, res.data]); setIsPanelOpen(false); showToast('Bed added successfully'); })
      .catch(err => {
        const msg = err.response?.data?.detail || err.response?.data?.error;
        if (msg) showToast(msg, 'error');
        else setFormErrors(err.response?.data || {});
      });
  };

  const updateStatus = (bedId, newStatus) => {
    api.patch(`/beds/${bedId}/`, { status: newStatus })
      .then(() => { fetchBeds(); showToast(`Bed marked as ${newStatus}`); })
      .catch(() => showToast('Failed to update status', 'error'));
  };

  const confirmDelete = () => {
    api.delete(`/beds/${deleteId}/`)
      .then(() => { setBeds(b => b.filter(x => x.id !== deleteId)); setDeleteId(null); showToast('Bed removed'); })
      .catch(err => {
        setDeleteId(null);
        showToast(err.response?.data?.detail || 'Cannot delete bed with an active tenant.', 'error');
      });
  };

  return (
    <div className="animate-page" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {deleteId && (
        <ConfirmDialog
          title="Remove Bed"
          message="The bed will be permanently removed. Unassign any tenant first."
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
            {flat && <Link to={`/flats/${flat.id}`}>{flat.name}</Link>}
            {flat && <span className="breadcrumb-sep">›</span>}
            <span style={{ color: 'var(--text)' }}>{room?.name || '...'}</span>
            <span className="breadcrumb-sep">›</span>
            <span>Beds</span>
          </div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
            {room ? room.name : 'Loading...'} — Beds
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {beds.length} bed{beds.length !== 1 ? 's' : ''} · capacity {room?.max_capacity || '—'}
          </p>
        </div>
        <button className="btn-header" onClick={openPanel}>
          <span style={{ fontSize: '1rem', lineHeight: 1, marginRight: '2px' }}>+</span> Add Bed
        </button>
      </div>

      {/* Bed Cards */}
      <div className="bed-cards-grid">
        {loading ? (
          [1,2,3,4].map(i => <SkeletonCard key={i} />)
        ) : beds.length === 0 ? (
          <div className="glass-flat" style={{ gridColumn: '1/-1', borderRadius: 'var(--r-xl)' }}>
            <div className="empty-state">
              <div className="empty-icon-wrap">🛏</div>
              <div className="empty-title">No beds yet</div>
              <div className="empty-sub">Add beds to this room to accommodate tenants.</div>
            </div>
          </div>
        ) : beds.map(bed => {
          const meta = STATUS_META[bed.status] || STATUS_META.available;
          return (
            <div key={bed.id} className="glass bed-card" style={{ borderRadius: 'var(--r-xl)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="bed-card-name">🛏 {bed.name}</div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--success)' }}>
                    ${parseFloat(bed.price || 0).toFixed(2)}
                  </span>
                  <span className={`badge ${meta.cls}`}>{meta.label}</span>
                </div>
              </div>

              {bed.tenant ? (
                <div style={{
                  background: 'rgba(245,158,11,0.06)',
                  border: '1px solid rgba(245,158,11,0.15)',
                  borderRadius: 'var(--r-md)',
                  padding: '0.6rem 0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem'
                }}>
                  {bed.tenant.photo ? (
                    <img 
                      src={bed.tenant.photo} 
                      alt={bed.tenant.name} 
                      style={{ 
                        width: 50, height: 50, borderRadius: 'var(--r-md)', 
                        objectFit: 'cover', border: '1px solid var(--border)', flexShrink: 0 
                      }} 
                    />
                  ) : (
                    <div style={{
                      width: 50, height: 50, borderRadius: 'var(--r-md)',
                      background: 'linear-gradient(135deg, var(--purple), var(--blue))',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1rem', fontWeight: 700, color: '#fff', flexShrink: 0
                    }}>
                      {bed.tenant.name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text)' }}>{bed.tenant.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{bed.tenant.phone}</div>
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  No tenant assigned
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {bed.status === 'available' && (
                  <button className="btn-action warning" onClick={() => updateStatus(bed.id, 'maintenance')}>
                    ⚙ Maintenance
                  </button>
                )}
                {bed.status === 'maintenance' && (
                  <button className="btn-action success" onClick={() => updateStatus(bed.id, 'available')}>
                    ✓ Mark Available
                  </button>
                )}
                <button className="btn-action danger" onClick={() => setDeleteId(bed.id)} style={{ marginLeft: 'auto' }}>
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Bed Panel */}
      <SlideInPanel
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        title="Add New Bed"
        subtitle={`Room: ${room?.name || '...'} · Max capacity: ${room?.max_capacity || '—'}`}
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-group">
            <label className="form-label">Bed Name</label>
            <input
              placeholder="e.g. Bed A, Bed 01, Upper Bunk"
              value={formData.name}
              onChange={e => setFormData({ name: e.target.value })}
              className={formErrors.name ? 'error' : ''}
            />
            {formErrors.name && <div className="form-error">⚠ {formErrors.name}</div>}
          </div>
          <div className="form-group">
            <label className="form-label">Monthly Rent Amount ($)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="e.g. 500"
              value={formData.price}
              onChange={e => setFormData({ ...formData, price: e.target.value })}
              className={formErrors.price ? 'error' : ''}
            />
            {formErrors.price && <div className="form-error">⚠ {formErrors.price}</div>}
          </div>
          <div style={{
            padding: '0.75rem 1rem',
            background: 'rgba(59,130,246,0.06)',
            border: '1px solid rgba(59,130,246,0.15)',
            borderRadius: 'var(--r-md)',
            fontSize: '0.78rem',
            color: 'var(--blue-light)',
          }}>
            ℹ New beds start as <strong>Available</strong> and can be assigned to a tenant from the Tenants page.
          </div>
          <button type="submit" className="btn-primary">Save Bed</button>
        </form>
      </SlideInPanel>
    </div>
  );
}
