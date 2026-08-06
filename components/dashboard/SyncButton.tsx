'use client'
import { useState, useEffect } from 'react'

const STORAGE_KEY = 'klar_sync_msg'

export default function SyncButton() {
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

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
    } catch {
      setMsg('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const isError = msg.startsWith('Error')

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {msg && (
        <span className={`kpi-change ${isError ? 'kpi-change-down' : 'kpi-change-up'}`}>
          {msg}
        </span>
      )}
      <button onClick={sync} disabled={loading} className="btn btn-ghost">
        <span style={{ fontSize: 13 }}>{loading ? '⏳' : '↻'}</span>
        {loading ? 'Sincronizando...' : 'Sincronizar'}
      </button>
    </div>
  )
}
