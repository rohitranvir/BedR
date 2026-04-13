import { useState, useEffect, useRef } from 'react';
import api from '../api';
import { SkeletonStatCard, SkeletonRow } from '../components/Skeleton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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

function StatCard({ icon, label, value, sub, colorClass, isCurrency }) {
  const animated = useCountUp(value);
  return (
    <div className="glass stat-card" style={{ borderRadius: 'var(--r-xl)' }}>
      <div className={`stat-icon ${colorClass}`}>{icon}</div>
      <div>
        <div className="stat-label">{label}</div>
        <div className="stat-value">{isCurrency ? '$' : ''}{animated}</div>
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
  const totalBeds     = data.reduce((a, f) => a + f.total_beds, 0);
  const totalOccupied = data.reduce((a, f) => a + f.occupied_beds, 0);
  const globalOcc     = totalBeds > 0 ? +((totalOccupied / totalBeds) * 100).toFixed(1) : 0;
  
  // Financial metrics
  const potentialRev  = data.reduce((a, f) => a + (f.potential_revenue || 0), 0);
  const actualRev     = data.reduce((a, f) => a + (f.actual_revenue || 0), 0);
  const commission    = data.reduce((a, f) => a + (f.commission_earned || 0), 0);

  // Data mapping for charts
  const chartData = data.map(f => ({
    name: f.flat_name.length > 15 ? f.flat_name.slice(0, 15) + '...' : f.flat_name,
    Potential: f.potential_revenue || 0,
    Actual: f.actual_revenue || 0,
    Commission: f.commission_earned || 0
  }));

  return (
    <div className="animate-page" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

      {/* STAT CARDS */}
      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        {loading ? (
          [1,2,3,4].map(i => <SkeletonStatCard key={i} />)
        ) : (
          <>
            <StatCard icon="💰" label="Actual Revenue" value={actualRev} sub={`Potential: $${potentialRev}`} colorClass="green" isCurrency />
            <StatCard icon="📈" label="Commission" value={commission} sub="Agency earnings" colorClass="gold" isCurrency />
            <StatCard icon="🏢" label="Total Properties" value={totalFlats} sub={`${totalBeds} total beds`} colorClass="purple" />
            <StatCard icon="📊" label="Occupancy Rate" value={globalOcc} sub={`${totalOccupied} / ${totalBeds} occupied`} colorClass="blue" />
          </>
        )}
      </div>

      {/* FINANCIAL CHART */}
      {!loading && data.length > 0 && (
        <div className="glass-flat" style={{ borderRadius: 'var(--r-xl)', padding: '1.75rem' }}>
          <div className="section-header" style={{ marginBottom: '1rem' }}>
            <div className="section-title">Revenue & Commission Insights</div>
          </div>
          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer>
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-sec)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-sec)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                <Tooltip 
                  cursor={{ fill: 'rgba(0,0,0,0.03)' }}
                  contentStyle={{ borderRadius: 'var(--r-md)', border: '1px solid var(--border)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 13, paddingTop: 10 }} />
                <Bar dataKey="Potential" fill="#94A3B8" radius={[4, 4, 0, 0]} maxBarSize={50} />
                <Bar dataKey="Actual" fill="var(--success)" radius={[4, 4, 0, 0]} maxBarSize={50} />
                <Bar dataKey="Commission" fill="var(--warning)" radius={[4, 4, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* FLAT OCCUPANCY TABLE */}
      <div className="glass-flat" style={{ borderRadius: 'var(--r-xl)', overflow: 'hidden' }}>
        <div className="table-section">
          <div className="section-header">
            <div className="section-title">Property Performance Details</div>
            {!loading && <span className="section-count">{data.length} flats</span>}
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Property</th>
                  <th>Occupied</th>
                  <th>Available</th>
                  <th style={{ minWidth: 150 }}>Occupancy</th>
                  <th>Revenue ($)</th>
                  <th>Commission ($)</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [1,2,3].map(i => <SkeletonRow key={i} cols={6} />)
                ) : data.length === 0 ? (
                  <tr><td colSpan={6}>
                    <div className="empty-state">
                      <div className="empty-icon-wrap">🏢</div>
                      <div className="empty-title">No properties yet</div>
                      <div className="empty-sub">Add your first flat to start tracking occupancy.</div>
                    </div>
                  </td></tr>
                ) : data.map(f => (
                  <tr key={f.flat_id}>
                    <td>
                      <div className="td-name">{f.flat_name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        📍 {f.address}
                      </div>
                    </td>
                    <td style={{ color: 'var(--text)', fontWeight: 600 }}>{f.occupied_beds}</td>
                    <td style={{ color: 'var(--text-sec)', fontWeight: 600 }}>{f.total_beds - f.occupied_beds}</td>
                    <td><ProgressBar percent={f.occupancy_percentage} /></td>
                    <td style={{ color: 'var(--success)', fontWeight: 600 }}>${f.actual_revenue || 0}</td>
                    <td style={{ color: 'var(--warning)', fontWeight: 600 }}>${f.commission_earned || 0}</td>
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
