export default function Skeleton({ width = '100%', height = '1rem', borderRadius = '8px', style = {} }) {
  return (
    <div
      className="skeleton"
      style={{ width, height, borderRadius, flexShrink: 0, ...style }}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="glass skeleton-card" style={{ borderRadius: 'var(--r-xl)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Skeleton width="44px" height="44px" borderRadius="12px" />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <Skeleton width="60%" height="0.9rem" />
          <Skeleton width="40%" height="0.7rem" />
        </div>
      </div>
      <Skeleton width="100%" height="0.7rem" />
      <Skeleton width="80%" height="0.7rem" />
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
        <Skeleton width="80px" height="28px" borderRadius="999px" />
        <Skeleton width="60px" height="28px" borderRadius="999px" />
      </div>
    </div>
  );
}

export function SkeletonStatCard() {
  return (
    <div className="glass stat-card" style={{ borderRadius: 'var(--r-xl)' }}>
      <Skeleton width="52px" height="52px" borderRadius="12px" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <Skeleton width="50%" height="0.65rem" />
        <Skeleton width="35%" height="1.8rem" />
      </div>
    </div>
  );
}

export function SkeletonRow({ cols = 4 }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} style={{ padding: '1rem' }}>
          <Skeleton width={i === 0 ? '70%' : '50%'} height="0.8rem" />
        </td>
      ))}
    </tr>
  );
}
