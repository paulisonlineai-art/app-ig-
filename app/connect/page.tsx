'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createAuthBrowserClient } from '@/lib/supabase-browser'

export default function ConnectPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [sessionCookie, setSessionCookie] = useState('')
  const [showCookieHelp, setShowCookieHelp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState<'checking' | 'google' | 'form' | 'connecting'>('checking')

  useEffect(() => {
    const supabase = createAuthBrowserClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetch('/api/apify/connect', { method: 'GET' }).then(r => {
          if (r.status === 200) {
            router.replace('/dashboard')
          } else {
            setStep('form')
          }
        }).catch(() => setStep('form'))
      } else {
        setStep('google')
      }
    })
  }, [router])

  const handleGoogle = async () => {
    setGoogleLoading(true)
    setError('')
    const supabase = createAuthBrowserClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) { setError(error.message); setGoogleLoading(false) }
  }

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
      router.push('/marca?onboarding=1')
    } catch (e: any) {
      setError(e.message)
      setStep('form')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'checking') {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>Cargando...</div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 520 }}>

        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>🎯</div>
          <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 6 }}>
            {step === 'google' ? 'Bienvenido a Klar' : 'Conectá tu Instagram'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            {step === 'google'
              ? 'Tu sistema de analytics de Instagram con IA'
              : 'Sin OAuth, sin permisos de Meta. Solo tu username.'}
          </p>
        </div>

        {error && (
          <div style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--danger)', marginBottom: 16 }}>
            {error}
          </div>
        )}

        {step === 'google' && (
          <div className="card" style={{ padding: 32, textAlign: 'center' }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Iniciá sesión</h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>
              Usá tu cuenta de Google para entrar
            </p>

            <button
              onClick={handleGoogle}
              disabled={googleLoading}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
                background: 'var(--surface)', border: '1.5px solid var(--border-strong)', borderRadius: 12,
                padding: '14px 20px', fontSize: 15, fontWeight: 600, cursor: googleLoading ? 'default' : 'pointer',
                color: 'var(--text)', transition: 'box-shadow 0.15s',
                boxShadow: 'var(--shadow-sm)',
                opacity: googleLoading ? 0.7 : 1,
              }}
            >
              {googleLoading ? (
                'Redirigiendo...'
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continuar con Google
                </>
              )}
            </button>

            <p style={{ marginTop: 20, fontSize: 12, color: 'var(--text-faint)', lineHeight: 1.6 }}>
              Al iniciar sesión aceptás que tus datos de Instagram se procesen para mostrarte analytics.
            </p>
          </div>
        )}

        {step === 'connecting' && (
          <div className="card" style={{ padding: 48, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Conectando con Apify...</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Estamos obteniendo tu perfil de Instagram.<br />Esto puede tardar 30-60 segundos.</div>
            <div style={{ marginTop: 24, height: 4, background: 'var(--surface-2)', borderRadius: 2 }}>
              <div style={{ height: '100%', background: 'var(--accent)', borderRadius: 2, width: '60%', animation: 'pulse 2s infinite' }} />
            </div>
          </div>
        )}

        {step === 'form' && (
          <div className="card" style={{ padding: 32 }}>

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
                Solo necesitás el username. Por ahora funciona con cuentas públicas — las cuentas privadas todavía no pueden sincronizar reels.
              </p>
            </div>

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
                    <li>Presioná <code style={{ background: 'var(--surface-2)', padding: '1px 5px', borderRadius: 4 }}>F12</code> → pestaña <strong>Application</strong></li>
                    <li>En la barra izquierda: <strong>Cookies → instagram.com</strong></li>
                    <li>Buscá la cookie llamada <code style={{ background: 'var(--surface-2)', padding: '1px 5px', borderRadius: 4 }}>sessionid</code></li>
                    <li>Copiá el valor y pegalo acá</li>
                  </ol>
                  <p style={{ marginTop: 8, color: 'var(--text-muted)' }}>
                    Opcional: si tu cuenta es privada, esto ayuda a traer tu foto de perfil y tu cantidad de seguidores. Todavía no habilita sincronizar reels de cuentas privadas, y no expone guardados ni alcance — Instagram no comparte esos datos públicamente con nadie.
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

            <button
              onClick={handleConnect}
              disabled={loading || !username.trim()}
              className="btn btn-primary"
              style={{ width: '100%', fontSize: 15, padding: '14px 0', fontWeight: 700 }}
            >
              {loading ? '⏳ Conectando...' : 'Conectar Instagram'}
            </button>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginTop: 20 }}>
              {['Sin OAuth de Meta', 'Sin permisos de app', 'Datos seguros', 'Powered by Apify'].map(b => (
                <span key={b} style={{ fontSize: 11, background: 'var(--surface-2)', color: 'var(--text-muted)', padding: '4px 10px', borderRadius: 20, fontWeight: 500 }}>{b}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
