'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ConnectPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [sessionCookie, setSessionCookie] = useState('')
  const [showCookieHelp, setShowCookieHelp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState<'form' | 'connecting'>('form')

  const handleConnect = async () => {
    if (!username.trim()) { setError('Ingresá tu @username de Instagram'); return }
    setLoading(true)
    setStep('connecting')
    setError('')

    try {
      const res = await fetch('/api/apify/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.replace('@', '').trim(),
          sessionCookie: sessionCookie.trim() || null,
        }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setError(data.error || 'Error conectando')
        setStep('form')
        return
      }
      router.push('/dashboard')
    } catch (e: any) {
      setError(e.message)
      setStep('form')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 520 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>🎯</div>
          <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 6 }}>Conectá tu Instagram</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Sin OAuth, sin permisos de Meta. Solo tu username.</p>
        </div>

        {step === 'connecting' ? (
          <div className="card" style={{ padding: 48, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Conectando con Apify...</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Estamos obteniendo tu perfil de Instagram.<br />Esto puede tardar 30-60 segundos.</div>
            <div style={{ marginTop: 24, height: 4, background: 'var(--surface-2)', borderRadius: 2 }}>
              <div style={{ height: '100%', background: 'var(--accent)', borderRadius: 2, width: '60%', animation: 'pulse 2s infinite' }} />
            </div>
          </div>
        ) : (
          <div className="card" style={{ padding: 32 }}>

            {/* Username input */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 8 }}>
                Username de Instagram <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 15, fontWeight: 600 }}>@</span>
                <input
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleConnect()}
                  placeholder="tuusuario"
                  style={{ paddingLeft: 28, fontSize: 15, fontWeight: 600, width: '100%' }}
                  autoFocus
                />
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 6 }}>
                Solo necesitás el username. Funciona con cuentas públicas y privadas.
              </p>
            </div>

            {/* Session cookie (optional) */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label style={{ fontSize: 13, fontWeight: 700 }}>
                  Session Cookie <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-muted)' }}>(opcional)</span>
                </label>
                <button
                  onClick={() => setShowCookieHelp(h => !h)}
                  style={{ fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                >
                  {showCookieHelp ? 'Cerrar ayuda' : '¿Cómo obtenerla?'}
                </button>
              </div>

              {showCookieHelp && (
                <div style={{ background: 'var(--accent-light)', borderRadius: 10, padding: 14, marginBottom: 12, fontSize: 12.5, lineHeight: 1.7 }}>
                  <strong style={{ color: 'var(--accent)' }}>Cómo obtener tu session cookie:</strong>
                  <ol style={{ margin: '8px 0 0 16px', padding: 0 }}>
                    <li>Abrí Instagram en Chrome y logueate</li>
                    <li>Presioná <code style={{ background: 'white', padding: '1px 5px', borderRadius: 4 }}>F12</code> → pestaña <strong>Application</strong></li>
                    <li>En la barra izquierda: <strong>Cookies → instagram.com</strong></li>
                    <li>Buscá la cookie llamada <code style={{ background: 'white', padding: '1px 5px', borderRadius: 4 }}>sessionid</code></li>
                    <li>Copiá el valor y pegalo acá</li>
                  </ol>
                  <p style={{ marginTop: 8, color: 'var(--text-muted)' }}>
                    Con la session cookie obtenés métricas privadas (saves, reach). Sin ella solo obtenés datos públicos.
                  </p>
                </div>
              )}

              <input
                value={sessionCookie}
                onChange={e => setSessionCookie(e.target.value)}
                placeholder="Pegá el valor de tu cookie 'sessionid'..."
                style={{ fontSize: 12, fontFamily: 'monospace', width: '100%' }}
              />
            </div>

            {error && (
              <div style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--danger)', marginBottom: 16 }}>
                {error}
              </div>
            )}

            <button
              onClick={handleConnect}
              disabled={loading || !username.trim()}
              className="btn btn-primary"
              style={{ width: '100%', fontSize: 15, padding: '14px 0', fontWeight: 700 }}
            >
              {loading ? '⏳ Conectando...' : '🚀 Conectar Instagram'}
            </button>

            {/* Badges */}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginTop: 20 }}>
              {['Sin OAuth de Meta', 'Sin permisos de app', 'Datos seguros', 'Powered by Apify'].map(b => (
                <span key={b} style={{ fontSize: 11, background: 'var(--surface-2)', color: 'var(--text-muted)', padding: '4px 10px', borderRadius: 20, fontWeight: 500 }}>{b}</span>
              ))}
            </div>
          </div>
        )}

        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: 'var(--text-faint)' }}>
          ¿Ya conectaste antes? <a href="/dashboard" style={{ color: 'var(--accent)', fontWeight: 600 }}>Ir al dashboard →</a>
        </p>
      </div>
    </div>
  )
}
