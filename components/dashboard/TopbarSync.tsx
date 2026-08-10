'use client'
import { useState } from 'react'
import { RefreshCw } from 'lucide-react'

export default function TopbarSync({ initialLabel }: { initialLabel: string | null }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const sync = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/instagram/sync', { method: 'POST' })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        window.location.reload()
      }
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button onClick={sync} disabled={loading} className="topbar-sync-btn" title={error || undefined}>
      <RefreshCw size={14} strokeWidth={2} style={loading ? { animation: 'ui-spin 0.8s linear infinite' } : undefined} />
      <span>{loading ? 'Sincronizando…' : error ? 'Error' : initialLabel ? `Sync ${initialLabel}` : 'Sincronizar'}</span>
    </button>
  )
}
