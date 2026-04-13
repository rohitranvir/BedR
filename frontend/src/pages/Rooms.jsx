import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import ConfirmDialog from '../components/ConfirmDialog';
import SlideInPanel from '../components/SlideInPanel';
import { useToast } from '../components/ToastContext';

function Rooms() {
  const { id } = useParams();
  const [flat, setFlat] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', max_capacity: '' });
  const [formErrors, setFormErrors] = useState(null);
  const [globalError, setGlobalError] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const showToast = useToast();

  const fetchRooms = useCallback(() => {
    api.get(`/flats/${id}/rooms/`)
      .then(res => {
        setRooms(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setGlobalError("Failed to fetch rooms.");
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    api.get(`/flats/${id}/`)
      .then(res => setFlat(res.data))
      .catch(err => {
        console.error(err);
        setGlobalError("Failed to load flat details.");
      });
    
    fetchRooms();
  }, [id, fetchRooms]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormErrors(null);
    setGlobalError(null);

    const payload = { ...formData, max_capacity: parseInt(formData.max_capacity, 10) };

    api.post(`/flats/${id}/rooms/`, payload)
      .then(res => {
        setRooms([...rooms, res.data]);
        setFormData({ name: '', max_capacity: '' });
        setIsPanelOpen(false);
        showToast('Room configured successfully');
      })
      .catch(err => {
        if (err.response && err.response.status === 400) {
          setFormErrors(err.response.data);
        } else {
          setGlobalError("An unexpected error occurred while creating the room.");
        }
      });
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    setGlobalError(null);
    api.delete(`/flats/${id}/rooms/${deleteId}/`)
      .then(() => {
        setRooms(rooms.filter(r => r.id !== deleteId));
        setDeleteId(null);
        showToast('Room successfully decommissioned');
      })
      .catch(err => {
        setDeleteId(null);
        if (err.response && err.response.status === 400) {
           const errorMsg = err.response.data.detail || err.response.data.error || err.response.data[0] || "Cannot delete this room due to backend constraints.";
           setGlobalError(errorMsg);
           showToast('Room constraint validation failed', 'error');
        } else if (err.response && err.response.status === 404) {
           setGlobalError("Room not found or unexpected router config.");
        } else {
           setGlobalError("Failed to delete room.");
           showToast('Routing failure triggered', 'error');
        }
      });
  };

  return (
    <div className="animate-fade-in relative">
      {deleteId && (
        <ConfirmDialog 
          message="Are you sure you want to delete this room?" 
          onConfirm={confirmDelete} 
          onCancel={() => setDeleteId(null)} 
        />
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ marginBottom: '0.25rem' }}>
             <Link to="/flats" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 }}>← PROXY RETURN</Link>
          </div>
          <h1 className="page-title" style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0 }}>
            {flat ? `${flat.name} Rooms` : 'Loading Directory...'}
          </h1>
        </div>
        <button className="btn-header" onClick={() => setIsPanelOpen(true)}>
          + Configure Room
        </button>
      </div>

      <ErrorMessage message={globalError} onDismiss={() => setGlobalError(null)} />

      {/* Slide-in Form Panel */}
      <SlideInPanel title="Provision New Room" isOpen={isPanelOpen} onClose={() => setIsPanelOpen(false)}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>Room Identifier</label>
            <input 
              placeholder="e.g. 101A" 
              required
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              style={{ borderColor: formErrors?.name ? 'var(--danger)' : 'var(--border)' }}
            />
            {formErrors?.name && <div style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.5rem' }}>{formErrors.name}</div>}
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>Resident Capacity Limit</label>
            <input 
              type="number"
              min="1"
              required
              placeholder="e.g. 2" 
              value={formData.max_capacity}
              onChange={e => setFormData({...formData, max_capacity: e.target.value})}
              style={{ borderColor: formErrors?.max_capacity ? 'var(--danger)' : 'var(--border)' }}
            />
            {formErrors?.max_capacity && <div style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.5rem' }}>{formErrors.max_capacity}</div>}
          </div>
          
          <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }}>
            Initialize Room Capacity
          </button>

          {formErrors?.detail && <div style={{ color: 'var(--danger)', fontSize: '0.9rem', marginTop: '0.5rem' }}>{formErrors.detail}</div>}
          {formErrors?.non_field_errors && <div style={{ color: 'var(--danger)', fontSize: '0.9rem', marginTop: '0.5rem' }}>{formErrors.non_field_errors}</div>}
        </form>
      </SlideInPanel>

      {/* Table of Rooms */}
      <div className="table-wrapper">
        <h2 className="table-title">Configured Room Logic</h2>
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Room Name</th>
                <th>Capacity Bound</th>
                <th>Active Beds</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="4"><LoadingSpinner text="Executing..." /></td></tr>
              ) : rooms.length === 0 ? (
                <tr><td colSpan="4"><div className="empty-state"><div className="empty-icon">🚪</div>No logic initialized. Provision your first Room.</div></td></tr>
              ) : (
                rooms.map(room => (
                  <tr key={room.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{room.name}</td>
                    <td>{room.max_capacity} Pax</td>
                    <td style={{ color: 'var(--text-muted)' }}>{room.beds?.length || 0}</td>
                    <td style={{ display: 'flex', gap: '0.75rem' }}>
                      <Link to={`/rooms/${room.id}`} className="btn-action accent">
                        <span style={{ fontSize: '1rem', lineHeight: 1 }}>🛏</span> View Beds
                      </Link>
                      <button onClick={() => setDeleteId(room.id)} className="btn-action danger">
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

export default Rooms;
