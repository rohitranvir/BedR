import React, { useState, useEffect, useRef, memo } from 'react';
import { useData } from '../components/DataContext';
import { SkeletonStatCard, SkeletonRow } from '../components/Skeleton';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, Area, AreaChart, ReferenceLine
} from 'recharts';

// ── Animated count-up hook ───────────────────────────────────────
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
        <div className={`progress-fill ${cls}`} style={{ width: `${Math.min(percent, 100)}%` }} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 600, color: label, minWidth: 38, textAlign: 'right' }}>
        {percent}%
      </span>
    </div>
  );
}

const StatCard = memo(({ icon, label, value, sub, colorClass, isCurrency }) => {
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
});

// ── Custom line-chart tooltip ────────────────────────────────────
function TrendTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r-md)',
      padding: '0.75rem 1rem',
      boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
      minWidth: 160,
    }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </div>
      {payload.map(p => (
        <div key={p.dataKey} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: 'var(--text-sec)' }}>{p.name}:</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
}

// ── Period selector button ───────────────────────────────────────
function PeriodBtn({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '0.28rem 0.75rem',
        borderRadius: 'var(--r-full)',
        border: '1px solid',
        borderColor: active ? 'var(--accent)' : 'var(--border)',
        background: active ? 'rgba(37,99,235,0.1)' : 'transparent',
        color: active ? 'var(--accent)' : 'var(--text-muted)',
        fontFamily: "'Inter', sans-serif",
        fontSize: 12,
        fontWeight: active ? 600 : 400,
        cursor: 'pointer',
        transition: 'all 0.15s ease',
      }}
    >
      {label}
    </button>
  );
}

const MemoizedTrendChart = memo(({ trendDataLabeled, trendMonths, maxCumulative }) => (
  <ResponsiveContainer width="100%" height="100%">
    <AreaChart data={trendDataLabeled} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
      <defs>
        <linearGradient id="gradCumulative" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%"  stopColor="var(--accent)"  stopOpacity={0.18} />
          <stop offset="95%" stopColor="var(--accent)"  stopOpacity={0} />
        </linearGradient>
        <linearGradient id="gradNew" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%"  stopColor="var(--success)" stopOpacity={0.15} />
          <stop offset="95%" stopColor="var(--success)" stopOpacity={0} />
        </linearGradient>
      </defs>

      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />

      <XAxis
        dataKey="month"
        stroke="var(--text-sec)"
        fontSize={12}
        tickLine={false}
        axisLine={false}
        tick={{ fill: 'var(--text-muted)' }}
        interval={trendMonths === 12 ? 1 : 0}
      />
      <YAxis
        yAxisId="cumulative"
        orientation="left"
        stroke="var(--text-sec)"
        fontSize={12}
        tickLine={false}
        axisLine={false}
        tick={{ fill: 'var(--text-muted)' }}
        domain={[0, Math.ceil(maxCumulative * 1.2) || 10]}
        label={{ value: 'Total', angle: -90, position: 'insideLeft', fontSize: 11, fill: 'var(--text-muted)', dx: -4 }}
      />
      <YAxis
        yAxisId="new"
        orientation="right"
        stroke="var(--text-sec)"
        fontSize={12}
        tickLine={false}
        axisLine={false}
        tick={{ fill: 'var(--text-muted)' }}
        label={{ value: 'New', angle: 90, position: 'insideRight', fontSize: 11, fill: 'var(--text-muted)', dx: 4 }}
      />

      <Tooltip content={<TrendTooltip />} />

      <Legend
        iconType="circle"
        iconSize={8}
        wrapperStyle={{ fontSize: 13, paddingTop: 12 }}
      />

      <Area
        yAxisId="cumulative"
        type="monotone"
        dataKey="cumulative_tenants"
        name="Cumulative Tenants"
        stroke="var(--accent)"
        strokeWidth={2.5}
        fill="url(#gradCumulative)"
        dot={false}
        activeDot={{ r: 5, fill: 'var(--accent)', stroke: '#fff', strokeWidth: 2 }}
      />

      <Area
        yAxisId="new"
        type="monotone"
        dataKey="new_tenants"
        name="New Tenants / Month"
        stroke="var(--success)"
        strokeWidth={2}
        strokeDasharray="5 3"
        fill="url(#gradNew)"
        dot={false}
        activeDot={{ r: 4, fill: 'var(--success)', stroke: '#fff', strokeWidth: 2 }}
      />
    </AreaChart>
  </ResponsiveContainer>
));

const MemoizedRevenueChart = memo(({ chartData }) => (
  <ResponsiveContainer width="100%" height="100%">
    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
      <XAxis dataKey="name" stroke="var(--text-sec)" fontSize={12} tickLine={false} axisLine={false} />
      <YAxis stroke="var(--text-sec)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
      <Tooltip
        cursor={{ fill: 'rgba(0,0,0,0.03)' }}
        contentStyle={{ borderRadius: 'var(--r-md)', border: '1px solid var(--border)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontFamily: "'Inter', sans-serif", fontSize: 13 }}
      />
      <Legend iconType="circle" wrapperStyle={{ fontSize: 13, paddingTop: 10 }} />
      <Bar dataKey="Potential"  fill="#94A3B8"         radius={[4, 4, 0, 0]} maxBarSize={50} />
      <Bar dataKey="Actual"     fill="var(--success)"  radius={[4, 4, 0, 0]} maxBarSize={50} />
      <Bar dataKey="Commission" fill="var(--warning)"  radius={[4, 4, 0, 0]} maxBarSize={50} />
    </BarChart>
  </ResponsiveContainer>
));

// ── Main Dashboard ───────────────────────────────────────────────
export default function Dashboard() {
  const { fetchWithCache, getCachedData } = useData();

  const hasLoadedOnce = useRef(!!getCachedData('/dashboard/'));
  const [data, setData]           = useState(getCachedData('/dashboard/') || []);
  const [loading, setLoading]     = useState(!hasLoadedOnce.current);
  const [error, setError]         = useState(null);

  const chartHeight = window.innerWidth < 768 ? 200 : 300;

  const [trendMonths, setTrendMonths] = useState(12);
  const trendEndpoint = `/occupancy-trend/?months=${trendMonths}`;
  
  const hasLoadedTrendOnce = useRef(!!getCachedData(trendEndpoint));
  const [trendData, setTrendData]     = useState(getCachedData(trendEndpoint) || []);
  const [trendLoading, setTrendLoading] = useState(!hasLoadedTrendOnce.current);

  // Fetch dashboard metrics
  useEffect(() => {
    fetchWithCache('/dashboard/', '/dashboard/')
      .then(res => { 
        setData(res); 
        hasLoadedOnce.current = true;
        setLoading(false); 
      })
      .catch(() => { 
        setError('Failed to fetch dashboard metrics.'); 
        setLoading(false); 
      });
  }, [fetchWithCache]);

  // Fetch trend data whenever period changes
  useEffect(() => {
    // If we've never cached this specific endpoint period, we can show a loader,
    // otherwise load silently in the background
    if (!getCachedData(trendEndpoint)) setTrendLoading(true);
    
    fetchWithCache(trendEndpoint, trendEndpoint)
      .then(res => { 
        setTrendData(res); 
        hasLoadedTrendOnce.current = true;
        setTrendLoading(false); 
      })
      .catch(() => setTrendLoading(false));
  }, [trendMonths, trendEndpoint, fetchWithCache, getCachedData]);

  if (error) return (
    <div className="glass-flat empty-state" style={{ borderRadius: 'var(--r-xl)', padding: '4rem' }}>
      <div className="empty-icon-wrap">⚠️</div>
      <div className="empty-title">{error}</div>
      <div className="empty-sub">Check that the backend is running and connected to Supabase.</div>
    </div>
  );

  const { totalFlats, totalBeds, totalOccupied, globalOcc, potentialRev, actualRev, commission } = React.useMemo(() => {
    const totalFlats    = data.length;
    const totalBeds     = data.reduce((a, f) => a + f.total_beds, 0);
    const totalOccupied = data.reduce((a, f) => a + f.occupied_beds, 0);
    const globalOcc     = totalBeds > 0 ? +((totalOccupied / totalBeds) * 100).toFixed(1) : 0;
    const potentialRev  = data.reduce((a, f) => a + (f.potential_revenue || 0), 0);
    const actualRev     = data.reduce((a, f) => a + (f.actual_revenue || 0), 0);
    const commission    = data.reduce((a, f) => a + (f.commission_earned || 0), 0);
    return { totalFlats, totalBeds, totalOccupied, globalOcc, potentialRev, actualRev, commission };
  }, [data]);

  const chartData = React.useMemo(() => data.map(f => ({
    name: f.flat_name.length > 15 ? f.flat_name.slice(0, 15) + '…' : f.flat_name,
    Potential: f.potential_revenue || 0,
    Actual: f.actual_revenue || 0,
    Commission: f.commission_earned || 0,
  })), [data]);

  // Thin out x-axis labels for 12-month view to avoid crowding
  const trendDataLabeled = React.useMemo(() => trendData.map((d, i) => ({
    ...d,
    shortMonth: trendMonths <= 6
      ? d.month
      : i % 2 === 0 ? d.month : '',
  })), [trendData, trendMonths]);

  const maxCumulative = React.useMemo(() => trendData.length
    ? Math.max(...trendData.map(d => d.cumulative_tenants))
    : 10, [trendData]);

  return (
    <div className="animate-page" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

      {/* ── STAT CARDS ───────────────────────────────────────── */}
      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        {loading ? (
          [1,2,3,4].map(i => <SkeletonStatCard key={i} />)
        ) : (
          <>
            <StatCard icon="💰" label="Actual Revenue"    value={actualRev}   sub={`Potential: $${potentialRev}`} colorClass="green"  isCurrency />
            <StatCard icon="📈" label="Commission"        value={commission}  sub="Agency earnings"               colorClass="gold"   isCurrency />
            <StatCard icon="🏢" label="Total Properties"  value={totalFlats}  sub={`${totalBeds} total beds`}     colorClass="purple" />
            <StatCard icon="📊" label="Occupancy Rate"    value={globalOcc}   sub={`${totalOccupied} / ${totalBeds} occupied`} colorClass="blue" />
          </>
        )}
      </div>

      {/* ── OCCUPANCY TREND LINE CHART ───────────────────────── */}
      <div className="glass-flat" style={{ borderRadius: 'var(--r-xl)', padding: '1.75rem' }}>
        <div className="section-header" style={{ marginBottom: '1.25rem' }}>
          <div>
            <div className="section-title">Occupancy Trend</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
              New &amp; cumulative tenants over time
            </div>
          </div>
          {/* Period selector */}
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            {[3, 6, 12].map(m => (
              <PeriodBtn
                key={m}
                label={`${m}M`}
                active={trendMonths === m}
                onClick={() => setTrendMonths(m)}
              />
            ))}
          </div>
        </div>

        {trendLoading ? (
          <div style={{ height: chartHeight, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
            Loading trend data…
          </div>
        ) : (
          <div style={{ width: '100%', height: chartHeight }}>
            <MemoizedTrendChart trendDataLabeled={trendDataLabeled} trendMonths={trendMonths} maxCumulative={maxCumulative} />
          </div>
        )}
      </div>

      {/* ── REVENUE BAR CHART ────────────────────────────────── */}
      {!loading && data.length > 0 && (
        <div className="glass-flat" style={{ borderRadius: 'var(--r-xl)', padding: '1.75rem' }}>
          <div className="section-header" style={{ marginBottom: '1rem' }}>
            <div className="section-title">Revenue &amp; Commission Insights</div>
          </div>
          <div style={{ width: '100%', height: chartHeight }}>
            <MemoizedRevenueChart chartData={chartData} />
          </div>
        </div>
      )}

      {/* ── FLAT OCCUPANCY TABLE ─────────────────────────────── */}
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
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>📍 {f.address}</div>
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
