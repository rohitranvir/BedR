export default function LoadingSpinner({ size = 28 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem' }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ animation: 'spin 0.8s linear infinite' }}
      >
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        <circle cx="12" cy="12" r="10" stroke="rgba(124,58,237,0.2)" strokeWidth="2.5"/>
        <path d="M12 2a10 10 0 0 1 10 10" stroke="var(--purple)" strokeWidth="2.5" strokeLinecap="round"/>
      </svg>
    </div>
  );
}
