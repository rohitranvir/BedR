import { useState, useEffect, useRef } from 'react';
import api from '../api';
import { SkeletonStatCard, SkeletonRow } from '../components/Skeleton';

function useCountUp(target, duration = 1200) {
  const [value, setValue] = useState(0);
  const frameRef = useRef(null);
  useEffect(() => {
    if (target === 0) { setValue(0); return; }
    let start = null;
    const step = (timestamp) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(ease * target));
      if (progress < 1) frameRef.current = requestAnimationFrame(step);
    };
    frameRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration]);
  return value;
}

function ProgressBar({ percent }) {
  const cls = percent >= 70 ? 'high' : percent >= 40 ? 'mid' : 'low';
  const label = percent >= 70 ? 'var(--success)' : percent >= 40 ? 'var(--warning)' : 'var(--danger)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <div className="progress-track" style={{ flex: 1, minWidth: 80 }}>
        <div
          className={`progress-fill ${cls}`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: label, minWidth: 38, textAlign: 'right' }}>
        {percent}%
      </span>
    </div>
  );
}

function StatCard({ icon, label, value, sub, colorClass }) {
  const animated = useCountUp(value);
  return (
    <div className="glass stat-card" style={{ borderRadius: 'var(--r-xl)' }}>
      <div className={`stat-icon ${colorClass}`}>{icon}</div>
      <div>
        <div className="stat-label">{label}</div>
        <div className="stat-value">{animated}</div>
        {sub && <div className="stat-sub">{sub}</div>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/dashboard/')
      .then(res => { setData(res.data); setLoading(false); })
      .catch(() => { setError('Failed to fetch dashboard metrics.'); setLoading(false); });
  }, []);

  if (error) return (
    <div className="glass-flat empty-state" style={{ borderRadius: 'var(--r-xl)', padding: '4rem' }}>
      <div className="empty-icon-wrap">⚠️</div>
      <div className="empty-title">{error}</div>
      <div className="empty-sub">Check that the backend is running and connected to Supabase.</div>
    </div>
  );

  const totalFlats    = data.length;
  const totalRooms    = data.reduce((a, f) => a + f.rooms.length, 0);
  const totalBeds     = data.reduce((a, f) => a + f.total_beds, 0);
  const totalOccupied = data.reduce((a, f) => a + f.occupied_beds, 0);
  const globalOcc     = totalBeds > 0 ? +((totalOccupied / totalBeds) * 100).toFixed(1) : 0;
  const allRooms      = data.flatMap(f => f.rooms.map(r => ({ ...r, flatName: f.flat_name })));

  return (
    <div className="animate-page" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

      {/* STAT CARDS */}
      <div className="stat-grid">
        {loading ? (
          [1,2,3,4].map(i => <SkeletonStatCard key={i} />)
        ) : (
          <>
            <StatCard icon="🏢" label="Total Flats" value={totalFlats} sub="Properties managed" colorClass="purple" />
            <StatCard icon="🚪" label="Total Rooms" value={totalRooms} sub="Across all flats" colorClass="blue" />
            <StatCard icon="🛏" label="Total Beds" value={totalBeds} sub={`${totalOccupied} occupied`} colorClass="gold" />
            <StatCard icon="📊" label="Occupancy Rate" value={globalOcc} sub={`${totalBeds - totalOccupied} beds available`} colorClass="green" />
          </>
        )}
      </div>

      {/* FLAT OCCUPANCY TABLE */}
      <div className="glass-flat" style={{ borderRadius: 'var(--r-xl)', overflow: 'hidden' }}>
        <div className="table-section">
          <div className="section-header">
            <div className="section-title">Occupancy by Property</div>
            {!loading && <span className="section-count">{data.length} flats</span>}
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Property</th>
                  <th>Total Beds</th>
                  <th>Occupied</th>
                  <th>Available</th>
                  <th style={{ minWidth: 200 }}>Occupancy</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [1,2,3].map(i => <SkeletonRow key={i} cols={5} />)
                ) : data.length === 0 ? (
                  <tr><td colSpan={5}>
                    <div className="empty-state">
                      <div className="empty-icon-wrap">🏢</div>
                      <div className="empty-title">No properties yet</div>
                      <div className="empty-sub">Add your first flat to start tracking occupancy.</div>
                    </div>
                  </td></tr>
                ) : data.map(f => (
                  <tr key={f.flat_id}>
                    <td className="td-name">{f.flat_name}</td>
                    <td>{f.total_beds}</td>
                    <td style={{ color: 'var(--gold-light)', fontWeight: 600 }}>{f.occupied_beds}</td>
                    <td style={{ color: 'var(--success)', fontWeight: 600 }}>{f.total_beds - f.occupied_beds}</td>
                    <td><ProgressBar percent={f.occupancy_percentage} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ROOM OCCUPANCY TABLE */}
      <div className="glass-flat" style={{ borderRadius: 'var(--r-xl)', overflow: 'hidden' }}>
        <div className="table-section">
          <div className="section-header">
            <div className="section-title">Occupancy by Room</div>
            {!loading && <span className="section-count">{allRooms.length} rooms</span>}
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Room</th>
                  <th>Property</th>
                  <th>Total Beds</th>
                  <th>Occupied</th>
                  <th>Available</th>
                  <th style={{ minWidth: 200 }}>Occupancy</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [1,2,3,4].map(i => <SkeletonRow key={i} cols={6} />)
                ) : allRooms.length === 0 ? (
                  <tr><td colSpan={6}>
                    <div className="empty-state">
                      <div className="empty-icon-wrap">🚪</div>
                      <div className="empty-title">No rooms yet</div>
                      <div className="empty-sub">Rooms will appear here once added to a flat.</div>
                    </div>
                  </td></tr>
                ) : allRooms.map(r => (
                  <tr key={r.room_id}>
                    <td className="td-name">{r.room_name}</td>
                    <td className="td-secondary">{r.flatName}</td>
                    <td>{r.total_beds}</td>
                    <td style={{ color: 'var(--gold-light)', fontWeight: 600 }}>{r.occupied_beds}</td>
                    <td style={{ color: 'var(--success)', fontWeight: 600 }}>{r.total_beds - r.occupied_beds}</td>
                    <td><ProgressBar percent={r.occupancy_percentage} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
