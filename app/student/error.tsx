'use client'

export default function StudentError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div style={{ padding: '48px', textAlign: 'center' }}>
      <div style={{
        fontSize: '13px', color: 'var(--danger)',
        background: 'var(--danger-bg)', borderRadius: '8px',
        padding: '12px 16px', marginBottom: '20px',
        display: 'inline-block',
        fontFamily: 'monospace',
      }}>
        {error.message || 'An unexpected error occurred'}
      </div>
      <br />
      <button
        onClick={reset}
        className="btn btn-primary btn-sm"
        style={{ marginTop: '8px' }}
      >
        Try again
      </button>
    </div>
  )
}
