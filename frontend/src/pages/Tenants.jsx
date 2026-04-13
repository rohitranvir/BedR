import { useState, useEffect } from 'react';
import api from '../api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import ConfirmDialog from '../components/ConfirmDialog';
import SlideInPanel from '../components/SlideInPanel';
import { useToast } from '../components/ToastContext';

function Tenants() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '' });
  const [formErrors, setFormErrors] = useState(null);
  const [globalError, setGlobalError] = useState(null);
  
  const [assigningTenantId, setAssigningTenantId] = useState(null);
  const [availableBeds, setAvailableBeds] = useState([]);
  const [selectedBedId, setSelectedBedId] = useState('');
  const [deleteId, setDeleteId] = useState(null);

  const showToast = useToast();

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = () => {
    api.get('/tenants/')
      .then(res => {
        setTenants(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setGlobalError("Failed to fetch tenants.");
        setLoading(false);
      });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormErrors(null);
    setGlobalError(null);

    api.post('/tenants/', formData)
      .then(res => {
        setTenants([...tenants, res.data]);
        setFormData({ name: '', phone: '' });
        setIsPanelOpen(false);
        showToast('Tenant injected successfully');
      })
      .catch(err => {
        if (err.response && err.response.status === 400) {
          const detail = err.response.data.detail || err.response.data.error;
          if (detail && typeof detail === 'string') {
             setGlobalError(detail);
             showToast(detail, 'error');
          } else {
             setFormErrors(err.response.data);
          }
        } else {
          setGlobalError("An unexpected error occurred while creating the tenant.");
        }
      });
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    setGlobalError(null);
    api.delete(`/tenants/${deleteId}/`)
      .then(() => {
        setTenants(tenants.filter(t => t.id !== deleteId));
        setDeleteId(null);
        showToast('Tenant permanently dropped');
      })
      .catch(err => {
        setDeleteId(null);
        if (err.response && err.response.status === 400) {
          const errorMsg = err.response.data.detail || err.response.data.error || err.response.data[0] || "Cannot delete tenant with active assignments.";
          setGlobalError(errorMsg);
          showToast(errorMsg, 'error');
        } else {
          setGlobalError("Failed to delete tenant.");
          showToast('Deletion failed', 'error');
        }
      });
  };

  const handleUnassign = (tenantId) => {
    setGlobalError(null);
    api.patch(`/tenants/${tenantId}/`, { bed: null })
      .then(() => {
         fetchTenants();
         showToast('Bed safely de-allocated');
      })
      .catch(err => {
        const detail = err.response?.data?.detail || err.response?.data?.error || err.message;
        setGlobalError("Failed to unassign bed: " + detail);
        showToast('De-allocation error', 'error');
      });
  };

  const startAssigning = (tenantId) => {
    setGlobalError(null);
    setAssigningTenantId(tenantId);
    setSelectedBedId('');
    
    api.get('/beds/?status=available')
       .then(res => setAvailableBeds(res.data))
       .catch(err => {
          console.error(err);
          setAvailableBeds([]);
          setGlobalError("Failed to load available beds.");
       });
  };

  const commitAssign = () => {
    if (!selectedBedId) {
      setAssigningTenantId(null);
      return;
    }
    setGlobalError(null);
    
    api.patch(`/tenants/${assigningTenantId}/`, { bed: selectedBedId })
      .then(() => {
        setAssigningTenantId(null);
        fetchTenants();
        showToast('Tenant node securely locked to Bed');
      })
      .catch(err => {
        const detail = err.response?.data?.detail || err.response?.data?.error || err.message;
        setGlobalError("Failed to assign bed: " + detail);
        showToast('Allocation blocked internally', 'error');
        setAssigningTenantId(null);
      });
  };

  return (
    <div className="animate-fade-in relative">
      {deleteId && (
        <ConfirmDialog 
          message="Are you sure you want to delete this tenant data?" 
          onConfirm={confirmDelete} 
          onCancel={() => setDeleteId(null)} 
        />
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 className="page-title" style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0 }}>Active Integrations (Tenants)</h1>
        <button className="btn-header" onClick={() => setIsPanelOpen(true)}>
          + Map Tenant Profile
        </button>
      </div>

      <ErrorMessage message={globalError} onDismiss={() => setGlobalError(null)} />

      {/* Slide-in Form Panel */}
      <SlideInPanel title="Register Integration Profile" isOpen={isPanelOpen} onClose={() => setIsPanelOpen(false)}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>Tenant Full Alias</label>
            <input 
              required
              placeholder="e.g. John Doe" 
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              style={{ borderColor: formErrors?.name ? 'var(--danger)' : 'var(--border)' }}
            />
            {formErrors?.name && <div style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.5rem' }}>{formErrors.name}</div>}
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>Encrypted Comm Link (Phone)</label>
            <input 
              required
              placeholder="e.g. +1 555-0192" 
              value={formData.phone}
              onChange={e => setFormData({...formData, phone: e.target.value})}
              style={{ borderColor: formErrors?.phone ? 'var(--danger)' : 'var(--border)' }}
            />
            {formErrors?.phone && <div style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.5rem' }}>{formErrors.phone}</div>}
          </div>
          
          <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }}>
            Compile Tenant Object
          </button>

          {formErrors?.detail && <div style={{ color: 'var(--danger)', fontSize: '0.9rem', marginTop: '0.5rem' }}>{formErrors.detail}</div>}
          {formErrors?.non_field_errors && <div style={{ color: 'var(--danger)', fontSize: '0.9rem', marginTop: '0.5rem' }}>{formErrors.non_field_errors}</div>}
        </form>
      </SlideInPanel>

      {/* Table of Tenants */}
      <div className="table-wrapper">
        <h2 className="table-title">Network Directory</h2>
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Profile Identifier</th>
                <th>Comm String</th>
                <th>Linked Hardware (Bed)</th>
                <th>Linked Sector (Room)</th>
                <th>Linked Root (Flat)</th>
                <th>Action Matrix</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6"><LoadingSpinner text="Connecting arrays..." /></td></tr>
              ) : tenants.length === 0 ? (
                <tr><td colSpan="6"><div className="empty-state"><div className="empty-icon">👤</div>Zero nodes detected. Register someone.</div></td></tr>
              ) : (
                tenants.map(tenant => (
                  <tr key={tenant.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{tenant.name}</td>
                    <td style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>{tenant.phone}</td>
                    
                    <td>{tenant.bed ? (tenant.bed.name || `Bed ${tenant.bed}`) : <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Orphaned</span>}</td>
                    <td>{tenant.bed?.room_name || tenant.bed?.room?.name || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>--</span>}</td>
                    <td>{tenant.bed?.flat_name || tenant.bed?.room?.flat?.name || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>--</span>}</td>

                    <td style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      {tenant.bed ? (
                        <button onClick={() => handleUnassign(tenant.id)} className="btn-action warning">
                          Unlink Block
                        </button>
                      ) : (
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                          {assigningTenantId === tenant.id ? (
                            <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(0,0,0,0.4)', padding: '0.25rem', borderRadius: '8px', border: '1px solid var(--accent)' }}>
                              <select 
                                value={selectedBedId}
                                onChange={e => setSelectedBedId(e.target.value)}
                                style={{ padding: '0.35rem', borderRadius: '4px', background: 'transparent', color: '#fff', border: 'none', borderRight: '1px solid var(--border)' }}
                              >
                                <option value="" style={{ background: 'var(--surface)' }}>Select Hardware...</option>
                                {availableBeds.map(b => (
                                  <option key={b.id} value={b.id} style={{ background: 'var(--surface)' }}>{b.name} ({b.room_name || b.room})</option>
                                ))}
                              </select>
                              <button onClick={commitAssign} style={{ background: 'transparent', color: 'var(--success)', border: 'none', padding: '0 0.5rem', fontWeight: 'bold', cursor: 'pointer' }}>✓</button>
                              <button onClick={() => setAssigningTenantId(null)} style={{ background: 'transparent', color: 'var(--danger)', border: 'none', padding: '0 0.5rem', fontWeight: 'bold', cursor: 'pointer' }}>✕</button>
                            </div>
                          ) : (
                            <button onClick={() => startAssigning(tenant.id)} className="btn-action success">
                              Locate Bed
                            </button>
                          )}
                        </div>
                      )}

                      <button onClick={() => setDeleteId(tenant.id)} className="btn-action danger">
                        <span style={{ fontSize: '0.9rem', lineHeight: 1 }}>✕</span> Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Tenants;
