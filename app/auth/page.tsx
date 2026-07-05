'use client'
import { useEffect } from 'react'
import { getOAuthUrl } from '@/lib/instagram'

export default function AuthPage() {
  const redirectUri = typeof window !== 'undefined'
    ? `${window.location.origin}/api/instagram/callback`
    : ''

  const handleConnect = () => {
    const url = getOAuthUrl(redirectUri)
    window.location.href = url
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--background)' }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: 48, maxWidth: 420, width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📱</div>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>Conectar Instagram</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 32, fontSize: 15, lineHeight: 1.6 }}>
          Conectá tu cuenta de Instagram Business para que Moka pueda acceder a tus métricas y analizar tu contenido.
        </p>
        <button
          onClick={handleConnect}
          style={{
            width: '100%',
            background: 'linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)',
            color: 'white',
            border: 'none',
            padding: '16px',
            borderRadius: 12,
            fontWeight: 700,
            fontSize: 16,
            cursor: 'pointer',
            marginBottom: 16,
          }}
        >
          Conectar con Instagram
        </button>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
          Necesitás una cuenta Business o Creator de Instagram conectada a una página de Facebook.
        </p>
        <div style={{ marginTop: 24, padding: 16, background: 'var(--surface-2)', borderRadius: 10, textAlign: 'left' }}>
          <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Permisos requeridos:</p>
          {['Leer tus publicaciones y métricas', 'Ver insights de audiencia', 'Acceder a historias (insights)', 'Ver datos de la página de Facebook'].map(p => (
            <p key={p} style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>✓ {p}</p>
          ))}
        </div>
      </div>
    </div>
  )
}
