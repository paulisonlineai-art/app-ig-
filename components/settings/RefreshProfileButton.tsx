'use client'
import { useState } from 'react'

export default function RefreshProfileButton() {
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  const refresh = async () => {
    setLoading(true)
    setMsg('')
    try {
      const res = await fetch('/api/apify/refresh-profile', { method: 'POST' })
      const data = await res.json()
      if (!res.ok || data.error) { setMsg(`Error: ${data.error}`); return }
      window.location.reload()
    } catch (e: any) {
      setMsg(e.message || 'Error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}>
      <button onClick={refresh} disabled={loading} className="btn btn-ghost" style={{ fontSize: 13 }}>
        {loading ? '⏳ Actualizando...' : '🔄 Actualizar foto y seguidores'}
      </button>
      {msg && <span style={{ fontSize: 12, color: 'var(--danger)' }}>{msg}</span>}
    </div>
  )
}
