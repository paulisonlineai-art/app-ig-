'use client'
import { useState, useEffect } from 'react'

const STORAGE_KEY = 'moka_sync_msg'

export default function SyncButton() {
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  // Pick up the message left behind by a sync that just triggered a reload,
  // so the diagnostic survives the refresh instead of vanishing with it.
  useEffect(() => {
    const pending = sessionStorage.getItem(STORAGE_KEY)
    if (pending) {
      setMsg(pending)
      sessionStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  const sync = async () => {
    setLoading(true)
    setMsg('')
    try {
      const res = await fetch('/api/apify/sync', { method: 'POST' })
      const data = await res.json()
      if (data.error) {
        setMsg(`Error: ${data.error}`)
      } else {
        sessionStorage.setItem(STORAGE_KEY, `✓ ${data.synced} reels — trial reels: ${data.trialCodesFound ?? 0}`)
        window.location.reload()
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
