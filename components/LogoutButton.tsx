'use client'
import { useState } from 'react'
import { createAuthBrowserClient } from '@/lib/supabase-browser'

export default function LogoutButton() {
  const [loading, setLoading] = useState(false)

  const logout = async () => {
    setLoading(true)
    try {
      // Clear ig_account_id (httpOnly, set by proxy.ts) while the session is
      // still valid — this route requires auth, so it must run before
      // supabase.auth.signOut() below invalidates it.
      await fetch('/api/auth/signout', { method: 'POST' })
      const supabase = createAuthBrowserClient()
      await supabase.auth.signOut()
    } finally {
      window.location.href = '/login'
    }
  }

  return (
    <button
      onClick={logout}
      disabled={loading}
      style={{
        display: 'flex', alignItems: 'center', gap: 10, width: '100%',
        padding: '9px 12px', borderRadius: 8, border: 'none', background: 'none',
        color: 'var(--text-muted)', fontSize: 13, fontWeight: 500,
        cursor: loading ? 'default' : 'pointer', textAlign: 'left',
      }}
    >
      <span style={{ fontSize: 14 }}>{loading ? '⏳' : '↪'}</span>
      {loading ? 'Cerrando sesión...' : 'Cerrar sesión'}
    </button>
  )
}
