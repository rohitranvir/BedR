import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import ConfirmDialog from '../components/ConfirmDialog';
import SlideInPanel from '../components/SlideInPanel';
import { useToast } from '../components/ToastContext';

function Beds() {
  const { id } = useParams();
  const [room, setRoom] = useState(null);
  const [flat, setFlat] = useState(null);
  const [beds, setBeds] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '' });
  const [formErrors, setFormErrors] = useState(null);
  const [globalError, setGlobalError] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const showToast = useToast();

  const fetchBeds = useCallback(() => {
    api.get(`/rooms/${id}/beds/`)
      .then(res => {
        setBeds(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setGlobalError("Failed to fetch beds.");
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    api.get(`/rooms/${id}/`)
      .then(res => {
        setRoom(res.data);
        if (res.data.flat) {
          api.get(`/flats/${res.data.flat}/`)
             .then(fRes => setFlat(fRes.data))
             .catch(fErr => console.error("Failed implicit flat fetch", fErr));
        }
      })
      .catch(err => {
        console.error(err);
        setGlobalError("Failed to load room details.");
      });
    
    fetchBeds();
  }, [id, fetchBeds]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormErrors(null);
    setGlobalError(null);

    api.post(`/rooms/${id}/beds/`, formData)
      .then(res => {
        setBeds([...beds, res.data]);
        setFormData({ name: '' });
        setIsPanelOpen(false);
        showToast('Bed configured successfully');
      })
      .catch(err => {
        if (err.response && err.response.status === 400) {
           const errorMsg = err.response.data.detail || err.response.data.error || err.response.data[0];
           if (errorMsg && typeof errorMsg === 'string') {
             showToast(errorMsg, 'error');
             setGlobalError(errorMsg);
           } else {
             setFormErrors(err.response.data);
           }
        } else {
          setGlobalError("An unexpected error occurred while creating the bed.");
        }
      });
  };

  const updateStatus = (bedId, newStatus) => {
    setGlobalError(null);
    api.patch(`/beds/${bedId}/`, { status: newStatus })
      .then(() => {
         fetchBeds();
         showToast(`Status shifted to ${newStatus}`);
      })
      .catch(err => {
         const errorMsg = err.response?.data?.detail || err.response?.data?.error || err.message || "Failed to update bed status.";
         setGlobalError(errorMsg);
         showToast('Status swap rejected', 'error');
      });
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    setGlobalError(null);
    
    api.delete(`/rooms/${id}/beds/${deleteId}/`)
      .catch(err => {
          if (err.response?.status === 404 || err.response?.status === 405) {
              return api.delete(`/beds/${deleteId}/`);
          }
          throw err;
      })
      .then(() => {
        setBeds(beds.filter(b => b.id !== deleteId));
        setDeleteId(null);
        showToast('Bed block removed securely');
      })
      .catch(err => {
        setDeleteId(null);
        if (err.response && err.response.status === 400) {
           const errorMsg = err.response.data.detail || err.response.data.error || err.response.data[0] || "Cannot delete this bed due to active tenants.";
           setGlobalError(errorMsg);
           showToast(errorMsg, 'error');
        } else {
           setGlobalError("Failed to delete bed.");
           showToast('Deletion aborted internally', 'error');
        }
      });
  };

  return (
    <div className="animate-fade-in relative">
      {deleteId && (
        <ConfirmDialog 
          message="Are you sure you want to delete this bed?" 
          onConfirm={confirmDelete} 
          onCancel={() => setDeleteId(null)} 
        />
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ marginBottom: '0.25rem' }}>
            {room && <Link to={`/flats/${room.flat}`} style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 }}>← RETURN TO {flat ? flat.name.toUpperCase() : 'FLAT'}</Link>}
          </div>
          <h1 className="page-title" style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0 }}>
            {room ? `${room.name} Bed Configuration` : 'Generating Module...'}
          </h1>
        </div>
        <button className="btn-header" onClick={() => setIsPanelOpen(true)}>
          + Map New Bed
        </button>
      </div>

      <ErrorMessage message={globalError} onDismiss={() => setGlobalError(null)} />

      {/* Slide-in Form Panel */}
      <SlideInPanel title="Provision New Bed Block" isOpen={isPanelOpen} onClose={() => setIsPanelOpen(false)}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>Bed Sequence Identity</label>
            <input 
              required
              placeholder="e.g. Bed 01" 
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              style={{ borderColor: formErrors?.name ? 'var(--danger)' : 'var(--border)' }}
            />
            {formErrors?.name && <div style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.5rem' }}>{formErrors.name}</div>}
          </div>
          
          <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }}>
            Inject Capacity Node
          </button>

          {formErrors?.detail && <div style={{ color: 'var(--danger)', fontSize: '0.9rem', marginTop: '0.5rem' }}>{formErrors.detail}</div>}
          {formErrors?.non_field_errors && <div style={{ color: 'var(--danger)', fontSize: '0.9rem', marginTop: '0.5rem' }}>{formErrors.non_field_errors}</div>}
        </form>
      </SlideInPanel>

      {/* Table of Beds */}
      <div className="table-wrapper">
        <h2 className="table-title">Bed Tracking Matrix</h2>
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Bed Identity</th>
                <th>Runtime Status</th>
                <th>Attached Identity</th>
                <th>Actions Matrix</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="4"><LoadingSpinner text="Executing scan..." /></td></tr>
              ) : beds.length === 0 ? (
                <tr><td colSpan="4"><div className="empty-state"><div className="empty-icon">🛏</div>Hardware idle. Map your first Bed block.</div></td></tr>
              ) : (
                beds.map(bed => (
                  <tr key={bed.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{bed.name}</td>
                    <td>
                      <span className={`badge ${bed.status}`}>
                         {bed.status}
                      </span>
                    </td>
                    <td>
                      {bed.tenant ? (
                        <div>
                          <div style={{ fontWeight: 500, color: 'var(--text-main)' }}>{bed.tenant.name}</div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{bed.tenant.phone}</div>
                        </div>
                      ) : (
                         <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Orphaned</span>
                      )}
                    </td>
                    <td style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {bed.status === 'available' && (
                        <button onClick={() => updateStatus(bed.id, 'maintenance')} className="btn-action warning">
                           Repair Mode
                        </button>
                      )}
                      {bed.status === 'maintenance' && (
                        <button onClick={() => updateStatus(bed.id, 'available')} className="btn-action success">
                           Clear Diagnostics
                        </button>
                      )}
                      <button onClick={() => setDeleteId(bed.id)} className="btn-action danger">
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

export default Beds;
