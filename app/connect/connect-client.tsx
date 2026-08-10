'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createAuthBrowserClient } from '@/lib/supabase-browser'

export default function ConnectClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [googleLoading, setGoogleLoading] = useState(false)
  const [igLoading, setIgLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState<'checking' | 'google' | 'connect_instagram'>('checking')

  useEffect(() => {
    // Surface any error from OAuth callback (e.g. user denied, conflict)
    const callbackError = searchParams.get('error')
    if (callbackError) {
      const clean = callbackError.startsWith('instagram_denied:')
        ? 'Cancelaste la conexión con Instagram. Podés intentarlo de nuevo.'
        : callbackError
      setError(clean)
    }

    const supabase = createAuthBrowserClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetch('/api/instagram/connect', { method: 'GET' }).then(r => {
          if (r.status === 200) {
            // Already connected and token valid
            router.replace('/dashboard')
          } else {
            setStep('connect_instagram')
          }
        }).catch(() => setStep('connect_instagram'))
      } else {
        setStep('google')
      }
    })
  }, [router, searchParams])

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

  const handleConnectInstagram = () => {
    setIgLoading(true)
    setError('')
    // Redirect to OAuth initiation — the server will build the Meta OAuth URL
    window.location.href = '/api/auth/instagram'
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
              : 'Conectate vía OAuth oficial de Meta para acceder a tus métricas completas.'}
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
              id="google-signin-btn"
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

        {step === 'connect_instagram' && (
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
              id="instagram-connect-btn"
              onClick={handleConnectInstagram}
              disabled={igLoading}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                background: 'linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)',
                border: 'none', borderRadius: 12,
                padding: '14px 20px', fontSize: 15, fontWeight: 700, cursor: igLoading ? 'default' : 'pointer',
                color: '#fff', transition: 'opacity 0.15s',
                opacity: igLoading ? 0.7 : 1,
              }}
            >
              {igLoading ? 'Redirigiendo a Meta...' : 'Conectar con Instagram'}
            </button>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginTop: 20 }}>
              {['API Oficial de Meta', 'OAuth Seguro', 'Analytics completos'].map(b => (
                <span key={b} style={{ fontSize: 11, background: 'var(--surface-2)', color: 'var(--text-muted)', padding: '4px 10px', borderRadius: 20, fontWeight: 500 }}>{b}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
