'use client'
import { useState } from 'react'
import { LogOut, Loader2 } from 'lucide-react'
import { createAuthBrowserClient } from '@/lib/supabase-browser'

export default function LogoutButton({ collapsed = false }: { collapsed?: boolean }) {
  const [loading, setLoading] = useState(false)

  const logout = async () => {
    setLoading(true)
    try {
      await fetch('/api/auth/signout', { method: 'POST' })
      const supabase = createAuthBrowserClient()
      await supabase.auth.signOut()
    } finally {
      window.location.href = '/connect'
    }
  }

  return (
    <button onClick={logout} disabled={loading} className="nav-link logout-btn" title={collapsed ? 'Cerrar sesión' : undefined}>
      {loading ? (
        <Loader2 size={18} strokeWidth={1.75} className="nav-link-icon" style={{ animation: 'ui-spin 0.6s linear infinite' }} />
      ) : (
        <LogOut size={18} strokeWidth={1.75} className="nav-link-icon" />
      )}
      {!collapsed && <span className="nav-link-label">{loading ? 'Cerrando sesión...' : 'Cerrar sesión'}</span>}
    </button>
  )
}
