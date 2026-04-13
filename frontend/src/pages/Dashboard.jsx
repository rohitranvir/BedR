import { useState, useEffect } from 'react';
import api from '../api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

function Dashboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/dashboard/')
      .then(res => {
        setData(res.data);
        setLoading(false);
      })
      .catch(err => {
        setError("Failed to fetch dashboard metrics.");
        setLoading(false);
      });
  }, []);

  if (loading) return <LoadingSpinner text="Loading dashboard metrics..." />;
  if (error) return <ErrorMessage message={error} />;

  // Aggregations
  const totalFlats = data.length;
  const totalRooms = data.reduce((acc, flat) => acc + flat.rooms.length, 0);
  const totalBeds = data.reduce((acc, flat) => acc + flat.total_beds, 0);
  const totalOccupied = data.reduce((acc, flat) => acc + flat.occupied_beds, 0);
  const globalOccupancy = totalBeds > 0 ? ((totalOccupied / totalBeds) * 100).toFixed(1) : 0;

  const allRooms = data.flatMap(flat => 
    flat.rooms.map(room => ({
      ...room,
      flatName: flat.flat_name
    }))
  );

  const getProgressColor = (percent) => {
    if (percent <= 40) return 'var(--danger)';
    if (percent <= 70) return 'var(--warning)';
    return 'var(--success)';
  };

  const renderProgressBar = (percent) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <div style={{ flex: 1, minWidth: '100px', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '999px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${Math.min(percent, 100)}%`, background: getProgressColor(percent), borderRadius: '999px' }} />
      </div>
      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: getProgressColor(percent), minWidth: '40px' }}>
        {percent}%
      </span>
    </div>
  );

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* KPI Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '1rem', background: 'rgba(108, 99, 255, 0.1)', borderRadius: '12px', color: 'var(--accent)', fontSize: '1.5rem' }}>🏢</div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Flats</div>
            <div style={{ fontSize: '2rem', fontWeight: 700, lineHeight: 1.2 }}>{totalFlats}</div>
          </div>
        </div>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', color: 'var(--success)', fontSize: '1.5rem' }}>🚪</div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Rooms</div>
            <div style={{ fontSize: '2rem', fontWeight: 700, lineHeight: 1.2 }}>{totalRooms}</div>
          </div>
        </div>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '1rem', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '12px', color: 'var(--warning)', fontSize: '1.5rem' }}>🛏</div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Beds</div>
            <div style={{ fontSize: '2rem', fontWeight: 700, lineHeight: 1.2 }}>{totalBeds}</div>
          </div>
        </div>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '12px', color: 'var(--danger)', fontSize: '1.5rem' }}>📈</div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Occupancy Rate</div>
            <div style={{ fontSize: '2rem', fontWeight: 700, lineHeight: 1.2 }}>{globalOccupancy}%</div>
          </div>
        </div>
      </div>

      {/* Flat Summary Table */}
      <div className="table-wrapper">
        <h2 className="table-title">Occupancy By Flat</h2>
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Flat Name</th>
                <th>Total Beds</th>
                <th>Occupied</th>
                <th>Available</th>
                <th style={{ minWidth: '200px' }}>Occupancy %</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr><td colSpan="5"><div className="empty-state"><div className="empty-icon">🏢</div>No data yet. Add your first Flat.</div></td></tr>
              ) : (
                data.map(flat => (
                  <tr key={flat.flat_id}>
                    <td style={{ fontWeight: 600 }}>{flat.flat_name}</td>
                    <td>{flat.total_beds}</td>
                    <td>{flat.occupied_beds}</td>
                    <td>{flat.total_beds - flat.occupied_beds}</td>
                    <td>{renderProgressBar(flat.occupancy_percentage)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Room Summary Table */}
      <div className="table-wrapper">
        <h2 className="table-title">Occupancy By Room</h2>
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Room Name</th>
                <th>Flat Name</th>
                <th>Total Beds</th>
                <th>Occupied</th>
                <th>Available</th>
                <th style={{ minWidth: '200px' }}>Occupancy %</th>
              </tr>
            </thead>
            <tbody>
              {allRooms.length === 0 ? (
                <tr><td colSpan="6"><div className="empty-state"><div className="empty-icon">🚪</div>No data yet. Add your first Room.</div></td></tr>
              ) : (
                allRooms.map(room => (
                  <tr key={room.room_id}>
                    <td style={{ fontWeight: 600 }}>{room.room_name}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{room.flatName}</td>
                    <td>{room.total_beds}</td>
                    <td>{room.occupied_beds}</td>
                    <td>{room.total_beds - room.occupied_beds}</td>
                    <td>{renderProgressBar(room.occupancy_percentage)}</td>
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

export default Dashboard;
