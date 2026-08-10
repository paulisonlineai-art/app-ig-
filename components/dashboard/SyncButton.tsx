'use client'
import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import Button from '@/components/ui/Button'

export default function SyncButton({ lastSyncLabel }: { lastSyncLabel?: string | null }) {
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
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      {error ? (
        <span style={{ fontSize: 12, color: 'var(--danger)' }}>{error}</span>
      ) : (
        lastSyncLabel && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Última sync: {lastSyncLabel}</span>
      )}
      <Button variant="outline" size="sm" onClick={sync} disabled={loading}>
        <RefreshCw size={14} strokeWidth={2} style={{ animation: loading ? 'ui-spin 0.8s linear infinite' : undefined }} />
        {loading ? 'Sincronizando…' : 'Sincronizar'}
      </Button>
    </div>
  )
}
