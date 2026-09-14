'use client'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

export default function ConnectClient() {
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const callbackError = searchParams.get('error')
    if (callbackError) {
      const clean = callbackError.startsWith('instagram_denied:')
        ? 'Cancelaste la conexión con Instagram. Podés intentarlo de nuevo.'
        : callbackError
      setError(clean)
    }
  }, [searchParams])

  const handleConnect = () => {
    setLoading(true)
    setError('')
    window.location.href = '/api/auth/instagram'
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 520 }}>

        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>🎯</div>
          <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 6 }}>
            Bienvenido a Klar
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Tu sistema de analytics de Instagram con IA
          </p>
        </div>

        {error && (
          <div style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--danger)', marginBottom: 16 }}>
            {error}
          </div>
        )}

        <div className="card" style={{ padding: 32 }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%', margin: '0 auto 16px',
              background: 'linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28,
            }}>
              📸
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Conectar Instagram</h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Autorizá a Klar vía la API oficial de Meta para acceder a tus métricas de reels:
              vistas, alcance, guardados y más.
            </p>
          </div>

          <div style={{ background: 'var(--surface-2)', borderRadius: 10, padding: 14, marginBottom: 24, fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.7 }}>
            <strong style={{ color: 'var(--text)', display: 'block', marginBottom: 6 }}>Permisos que se solicitarán:</strong>
            <ul style={{ margin: 0, paddingLeft: 16 }}>
              <li>Ver tu perfil e información básica</li>
              <li>Acceder a las métricas de tus reels (plays, alcance, guardados)</li>
              <li>Leer insights de tu página de Facebook vinculada</li>
            </ul>
            <p style={{ marginTop: 8, color: 'var(--text-faint)', fontSize: 12 }}>
              ⚠️ Requiere una cuenta de Instagram Business o Creator.
            </p>
          </div>

          <button
            onClick={handleConnect}
            disabled={loading}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              background: 'linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)',
              border: 'none', borderRadius: 12,
              padding: '14px 20px', fontSize: 15, fontWeight: 700, cursor: loading ? 'default' : 'pointer',
              color: '#fff', transition: 'opacity 0.15s',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Redirigiendo a Instagram...' : 'Conectar con Instagram'}
          </button>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginTop: 20 }}>
            {['API Oficial de Meta', 'OAuth Seguro', 'Analytics completos'].map(b => (
              <span key={b} style={{ fontSize: 11, background: 'var(--surface-2)', color: 'var(--text-muted)', padding: '4px 10px', borderRadius: 20, fontWeight: 500 }}>{b}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
