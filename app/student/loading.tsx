export default function StudentLoading() {
  return (
    <div className="fade-in" style={{ padding: '32px' }}>
      {/* Header skeleton */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ width: '240px', height: '28px', background: 'var(--gray-light)', borderRadius: '6px', marginBottom: '8px' }} />
        <div style={{ width: '320px', height: '16px', background: 'var(--gray-light)', borderRadius: '4px' }} />
      </div>

      {/* Stat cards skeleton */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '14px', marginBottom: '28px' }}>
        {[...Array(4)].map((_, i) => (
          <div key={i} style={{ height: '88px', background: 'var(--gray-light)', borderRadius: '12px' }} />
        ))}
      </div>

      {/* Content skeleton */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        {[...Array(2)].map((_, i) => (
          <div key={i} style={{ height: '280px', background: 'var(--gray-light)', borderRadius: '12px' }} />
        ))}
      </div>
    </div>
  )
}
