'use client'
import { useState } from 'react'

export default function SyncButton() {
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  const sync = async () => {
    setLoading(true)
    setMsg('')
    try {
      const res = await fetch('/api/apify/sync', { method: 'POST' })
      const data = await res.json()
      if (data.error) setMsg(`Error: ${data.error}`)
      else {
        setMsg(data.trialDetectionError ? `✓ ${data.synced} reels (trial reels: ${data.trialDetectionError})` : `✓ ${data.synced} reels`)
        setTimeout(() => { setMsg(''); window.location.reload() }, data.trialDetectionError ? 6000 : 2000)
      }
    } catch { setMsg('Error') }
    finally { setLoading(false) }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {msg && <span style={{ fontSize: 12, color: 'var(--success)', fontWeight: 600 }}>{msg}</span>}
      <button
        onClick={sync}
        disabled={loading}
        className="btn btn-ghost"
        style={{ display: 'flex', alignItems: 'center', gap: 6 }}
      >
        <span style={{ fontSize: 13 }}>{loading ? '⏳' : '↻'}</span>
        {loading ? 'Sincronizando...' : 'Sincronizar'}
      </button>
    </div>
  )
}
