import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import ConfirmDialog from '../components/ConfirmDialog';
import SlideInPanel from '../components/SlideInPanel';
import { useToast } from '../components/ToastContext';

function Flats() {
  const [flats, setFlats] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', address: '' });
  const [formErrors, setFormErrors] = useState(null);
  
  const [globalError, setGlobalError] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  
  const showToast = useToast();

  useEffect(() => {
    fetchFlats();
  }, []);

  const fetchFlats = () => {
    api.get('/flats/')
      .then(res => {
        setFlats(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setGlobalError("Failed to fetch flats.");
        setLoading(false);
      });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormErrors(null);
    setGlobalError(null);

    api.post('/flats/', formData)
      .then(res => {
        setFlats([...flats, res.data]);
        setFormData({ name: '', address: '' });
        setIsPanelOpen(false);
        showToast('Flat created successfully');
      })
      .catch(err => {
        if (err.response && err.response.status === 400) {
          setFormErrors(err.response.data);
        } else {
          setGlobalError("An unexpected error occurred while creating the flat.");
        }
      });
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    setGlobalError(null);
    api.delete(`/flats/${deleteId}/`)
      .then(() => {
        setFlats(flats.filter(f => f.id !== deleteId));
        setDeleteId(null);
        showToast('Flat deleted securely');
      })
      .catch(err => {
        setDeleteId(null);
        if (err.response && err.response.status === 400) {
           const errorMsg = err.response.data.detail || err.response.data.error || err.response.data[0] || "Cannot delete this flat due to active tenants.";
           showToast(errorMsg, 'error');
           setGlobalError(errorMsg);
        } else {
           showToast('Failed to delete flat', 'error');
           setGlobalError("Failed to delete flat.");
        }
      });
  };

  return (
    <div className="animate-fade-in relative">
      {deleteId && (
        <ConfirmDialog 
          message="This flat may have active tenants. Are you sure you want to delete?" 
          onConfirm={confirmDelete} 
          onCancel={() => setDeleteId(null)} 
        />
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 className="page-title" style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0 }}>Flats Network</h1>
        <button className="btn-header" onClick={() => setIsPanelOpen(true)}>
          + Add Flat
        </button>
      </div>

      <ErrorMessage message={globalError} onDismiss={() => setGlobalError(null)} />

      {/* Slide-in Form Panel */}
      <SlideInPanel title="Configure New Flat" isOpen={isPanelOpen} onClose={() => setIsPanelOpen(false)}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>Flat Identifier</label>
            <input 
              placeholder="e.g. Skyline Apartments" 
              value={formData.name}
              required
              onChange={e => setFormData({...formData, name: e.target.value})}
              style={{ borderColor: formErrors?.name ? 'var(--danger)' : 'var(--border)' }}
            />
            {formErrors?.name && <div style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.5rem' }}>{formErrors.name}</div>}
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>Full Address Location</label>
            <input 
              placeholder="e.g. 123 Cloud Ave, BLDG 4" 
              value={formData.address}
              required
              onChange={e => setFormData({...formData, address: e.target.value})}
              style={{ borderColor: formErrors?.address ? 'var(--danger)' : 'var(--border)' }}
            />
            {formErrors?.address && <div style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.5rem' }}>{formErrors.address}</div>}
          </div>
          
          <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }}>
            Initialize Flat Configuration
          </button>

          {formErrors?.detail && <div style={{ color: 'var(--danger)', fontSize: '0.9rem', marginTop: '0.5rem' }}>{formErrors.detail}</div>}
          {formErrors?.non_field_errors && <div style={{ color: 'var(--danger)', fontSize: '0.9rem', marginTop: '0.5rem' }}>{formErrors.non_field_errors}</div>}
        </form>
      </SlideInPanel>

      {/* Table of Flats */}
      <div className="table-wrapper">
        <h2 className="table-title">Registered Properties</h2>
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Flat Name</th>
                <th>Address Location</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="3"><LoadingSpinner text="Loading flats..." /></td></tr>
              ) : flats.length === 0 ? (
                <tr><td colSpan="3"><div className="empty-state"><div className="empty-icon">🏢</div>No data yet. Add your first Flat.</div></td></tr>
              ) : (
                flats.map(flat => (
                  <tr key={flat.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{flat.name}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{flat.address}</td>
                    <td style={{ display: 'flex', gap: '0.75rem' }}>
                      <Link to={`/flats/${flat.id}`} className="btn-action accent">
                        <span style={{ fontSize: '1rem', lineHeight: 1 }}>⚙</span> Manage Rooms
                      </Link>
                      <button onClick={() => setDeleteId(flat.id)} className="btn-action danger">
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

export default Flats;
