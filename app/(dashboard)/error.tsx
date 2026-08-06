'use client'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="error-page">
      <div className="empty-state-icon">⚠️</div>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Algo salió mal</h2>
      <p className="empty-state-desc" style={{ marginBottom: 24, maxWidth: 400 }}>
        Hubo un error cargando esta página. Podés intentar de nuevo o volver al dashboard.
      </p>
      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={reset} className="btn btn-primary">
          Intentar de nuevo
        </button>
        <a href="/dashboard" className="btn btn-ghost">
          Ir al Dashboard
        </a>
      </div>
    </div>
  )
}
