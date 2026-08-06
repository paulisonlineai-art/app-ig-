'use client'
import { useState } from 'react'
import { createAuthBrowserClient } from '@/lib/supabase-browser'

export default function LogoutButton() {
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
    <button onClick={logout} disabled={loading} className="nav-link logout-btn">
      <span className="nav-link-icon">{loading ? '⏳' : '↪'}</span>
      {loading ? 'Cerrando sesión...' : 'Cerrar sesión'}
    </button>
  )
}
