'use client'
import { useState } from 'react'

export default function CompetitorCard({ competitor }: { competitor: any }) {
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState('')

  const sync = async () => {
    setSyncing(true)
    try {
      const res = await fetch('/api/competitors/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ competitorId: competitor.id }),
      })
      const data = await res.json()
      setSyncResult(data.synced ? `${data.synced} reels` : 'Error')
    } finally {
      setSyncing(false)
    }
  }

  const reelCount = competitor.competitor_reels?.[0]?.count || 0

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        {competitor.profile_picture_url && (
          <img src={competitor.profile_picture_url} alt="" style={{ width: 48, height: 48, borderRadius: '50%' }} />
        )}
        <div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>@{competitor.ig_username}</div>
          {competitor.followers_count && (
            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
              {competitor.followers_count.toLocaleString()} seguidores
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <div style={{ flex: 1, background: 'var(--surface-2)', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 700 }}>{reelCount}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Reels trackeados</div>
        </div>
        {competitor.last_synced_at && (
          <div style={{ flex: 1, background: 'var(--surface-2)', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
            <div style={{ fontSize: 12, fontWeight: 600 }}>
              {new Date(competitor.last_synced_at).toLocaleDateString('es')}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Última sync</div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={sync}
          disabled={syncing}
          style={{
            flex: 1,
            background: syncing ? 'var(--border)' : 'var(--accent)',
            color: 'white',
            border: 'none',
            padding: '10px',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            cursor: syncing ? 'not-allowed' : 'pointer',
          }}
        >
          {syncing ? '⏳ Sincronizando...' : '🔄 Sincronizar reels'}
        </button>
      </div>
      {syncResult && <p style={{ fontSize: 12, color: 'var(--success)', marginTop: 8 }}>✓ {syncResult} sincronizados</p>}
    </div>
  )
}
