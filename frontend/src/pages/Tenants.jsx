import { useState, useEffect } from 'react';
import api from '../api';
import { SkeletonRow } from '../components/Skeleton';
import SlideInPanel from '../components/SlideInPanel';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../components/ToastContext';

function initials(name) {
  return name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??';
}

export default function Tenants() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isAssignPanelOpen, setIsAssignPanelOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '' });
  const [formErrors, setFormErrors] = useState({});
  const [deleteId, setDeleteId] = useState(null);
  const [assigningTenant, setAssigningTenant] = useState(null);
  const [availableBeds, setAvailableBeds] = useState([]);
  const [selectedBedId, setSelectedBedId] = useState('');
  const [bedsLoading, setBedsLoading] = useState(false);
  const showToast = useToast();

  useEffect(() => { fetchTenants(); }, []);

  const fetchTenants = () => {
    api.get('/tenants/')
      .then(res => { setTenants(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  const openAddPanel = () => {
    setFormData({ name: '', phone: '' });
    setFormErrors({});
    setIsPanelOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Full name is required';
    if (!formData.phone.trim()) errors.phone = 'Phone number is required';
    if (Object.keys(errors).length) { setFormErrors(errors); return; }

    api.post('/tenants/', formData)
      .then(res => {
        setTenants(prev => [...prev, res.data]);
        setIsPanelOpen(false);
        showToast('Tenant registered successfully');
      })
      .catch(err => {
        if (err.response?.status === 400) setFormErrors(err.response.data);
        else showToast('Failed to add tenant', 'error');
      });
  };

  const confirmDelete = () => {
    api.delete(`/tenants/${deleteId}/`)
      .then(() => { setTenants(t => t.filter(x => x.id !== deleteId)); setDeleteId(null); showToast('Tenant removed'); })
      .catch(err => {
        setDeleteId(null);
        showToast(err.response?.data?.detail || 'Unassign the bed first before deleting.', 'error');
      });
  };

  const openAssignPanel = (tenant) => {
    setAssigningTenant(tenant);
    setSelectedBedId('');
    setAvailableBeds([]);
    setBedsLoading(true);
    setIsAssignPanelOpen(true);
    api.get('/beds/?status=available')
      .then(res => { setAvailableBeds(res.data); setBedsLoading(false); })
      .catch(() => setBedsLoading(false));
  };

  const commitAssign = () => {
    if (!selectedBedId) { showToast('Please select a bed', 'error'); return; }
    api.patch(`/tenants/${assigningTenant.id}/`, { bed: parseInt(selectedBedId) })
      .then(() => { setIsAssignPanelOpen(false); setAssigningTenant(null); fetchTenants(); showToast('Bed assigned successfully'); })
      .catch(err => showToast(err.response?.data?.detail || 'Failed to assign bed', 'error'));
  };

  const handleUnassign = (tenantId) => {
    api.patch(`/tenants/${tenantId}/`, { bed: null })
      .then(() => { fetchTenants(); showToast('Bed unassigned'); })
      .catch(() => showToast('Failed to unassign bed', 'error'));
  };

  return (
    <div className="animate-page" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {deleteId && (
        <ConfirmDialog
          title="Remove Tenant"
          message="This will permanently delete the tenant record. Make sure they are unassigned from their bed first."
          onConfirm={confirmDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.03em' }}>Tenants</h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            {loading ? '—' : `${tenants.length} registered tenant${tenants.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button className="btn-header" onClick={openAddPanel}>
          <span style={{ fontSize: '1rem', lineHeight: 1, marginRight: '2px' }}>+</span> Add Tenant
        </button>
      </div>

      {/* Table */}
      <div className="glass-flat" style={{ borderRadius: 'var(--r-xl)', overflow: 'hidden' }}>
        <div className="table-section">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Bed</th>
                  <th>Room</th>
                  <th>Flat</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [1,2,3,4].map(i => <SkeletonRow key={i} cols={6} />)
                ) : tenants.length === 0 ? (
                  <tr><td colSpan={6}>
                    <div className="empty-state">
                      <div className="empty-icon-wrap">👤</div>
                      <div className="empty-title">No tenants yet</div>
                      <div className="empty-sub">Register a tenant and assign them to an available bed.</div>
                    </div>
                  </td></tr>
                ) : tenants.map(tenant => {
                  const bed = tenant.bed;
                  return (
                    <tr key={tenant.id}>
                      {/* Name */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <div className="avatar">{initials(tenant.name)}</div>
                          <div>
                            <div className="td-name">{tenant.name}</div>
                          </div>
                        </div>
                      </td>

                      {/* Phone */}
                      <td>
                        <span style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          {tenant.phone}
                        </span>
                      </td>

                      {/* Bed */}
                      <td>
                        {bed ? (
                          <span className="badge occupied">{bed.name || `Bed ${bed.id}`}</span>
                        ) : (
                          <span className="td-muted">Unassigned</span>
                        )}
                      </td>

                      {/* Room */}
                      <td>
                        {bed?.room_name || bed?.room?.name
                          ? <span className="td-secondary">{bed?.room_name || bed?.room?.name}</span>
                          : <span className="td-muted">—</span>
                        }
                      </td>

                      {/* Flat */}
                      <td>
                        {bed?.flat_name || bed?.room?.flat?.name
                          ? <span className="td-secondary">{bed?.flat_name || bed?.room?.flat?.name}</span>
                          : <span className="td-muted">—</span>
                        }
                      </td>

                      {/* Actions */}
                      <td className="td-actions">
                        {bed ? (
                          <button className="btn-action warning" onClick={() => handleUnassign(tenant.id)}>
                            Unassign Bed
                          </button>
                        ) : (
                          <button className="btn-action success" onClick={() => openAssignPanel(tenant)}>
                            Assign Bed
                          </button>
                        )}
                        <button className="btn-action danger" onClick={() => setDeleteId(tenant.id)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ADD TENANT PANEL */}
      <SlideInPanel
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        title="Register New Tenant"
        subtitle="Add a resident to assign them to a bed"
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              placeholder="e.g. Rohit Kumar"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className={formErrors.name ? 'error' : ''}
            />
            {formErrors.name && <div className="form-error">⚠ {formErrors.name}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input
              placeholder="e.g. +91 98765 43210"
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
              className={formErrors.phone ? 'error' : ''}
            />
            {formErrors.phone && <div className="form-error">⚠ {formErrors.phone}</div>}
          </div>

          <div style={{
            padding: '0.75rem 1rem',
            background: 'rgba(124,58,237,0.06)',
            border: '1px solid rgba(124,58,237,0.15)',
            borderRadius: 'var(--r-md)',
            fontSize: '0.78rem',
            color: 'var(--purple-light)',
          }}>
            💡 After registering, use the <strong>Assign Bed</strong> button in the table to link them to an available bed.
          </div>

          <button type="submit" className="btn-primary">Register Tenant</button>
        </form>
      </SlideInPanel>

      {/* ASSIGN BED PANEL */}
      <SlideInPanel
        isOpen={isAssignPanelOpen}
        onClose={() => { setIsAssignPanelOpen(false); setAssigningTenant(null); }}
        title="Assign Bed"
        subtitle={assigningTenant ? `Assigning to: ${assigningTenant.name}` : ''}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-group">
            <label className="form-label">Select Available Bed</label>
            {bedsLoading ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading available beds...</div>
            ) : availableBeds.length === 0 ? (
              <div style={{
                padding: '1rem',
                background: 'var(--danger-bg)',
                border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: 'var(--r-md)',
                fontSize: '0.82rem',
                color: '#f87171'
              }}>
                No available beds at the moment. Mark a bed as available from the Beds page first.
              </div>
            ) : (
              <select
                value={selectedBedId}
                onChange={e => setSelectedBedId(e.target.value)}
              >
                <option value="">— Choose a bed —</option>
                {availableBeds.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.name} (Room {b.room})
                  </option>
                ))}
              </select>
            )}
          </div>

          {availableBeds.length > 0 && (
            <button
              className="btn-primary"
              onClick={commitAssign}
              disabled={!selectedBedId}
              style={{ opacity: selectedBedId ? 1 : 0.5 }}
            >
              Confirm Assignment
            </button>
          )}
        </div>
      </SlideInPanel>
    </div>
  );
}
