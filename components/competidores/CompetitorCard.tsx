'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatNumber } from '@/lib/utils'

export default function CompetitorCard({ competitor }: { competitor: any }) {
  const router = useRouter()
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState('')
  const [showReels, setShowReels] = useState(false)

  const sync = async () => {
    setSyncing(true)
    setError('')
    try {
      const res = await fetch('/api/competitors/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ competitorId: competitor.id }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setError(data.error || 'Error al sincronizar')
        return
      }
      setShowReels(true)
      router.refresh()
    } catch (e: any) {
      setError(e.message || 'Error al sincronizar')
    } finally {
      setSyncing(false)
    }
  }

  const reels = (competitor.competitor_reels || []) as any[]
  const reelCount = reels.length

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        {competitor.profile_picture_url ? (
          <img src={`/api/proxy-image?url=${encodeURIComponent(competitor.profile_picture_url)}`} alt="" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>👤</div>
        )}
        <div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>@{competitor.ig_username}</div>
          {competitor.followers_count ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
              {competitor.followers_count.toLocaleString()} seguidores
            </div>
          ) : null}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button
          onClick={() => reelCount > 0 && setShowReels(s => !s)}
          disabled={reelCount === 0}
          style={{ flex: 1, background: 'var(--surface-2)', border: 'none', borderRadius: 8, padding: '10px 12px', textAlign: 'center', cursor: reelCount > 0 ? 'pointer' : 'default' }}
        >
          <div style={{ fontSize: 20, fontWeight: 700 }}>{reelCount}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Reels trackeados {reelCount > 0 ? (showReels ? '▲' : '▼') : ''}</div>
        </button>
        {competitor.last_synced_at && (
          <div style={{ flex: 1, background: 'var(--surface-2)', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
            <div style={{ fontSize: 12, fontWeight: 600 }}>
              {new Date(competitor.last_synced_at).toLocaleDateString('es')}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Última sync</div>
          </div>
        )}
      </div>

      <button
        onClick={sync}
        disabled={syncing}
        style={{
          width: '100%',
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

      {error && <p style={{ fontSize: 12, color: 'var(--danger)', marginTop: 8 }}>{error}</p>}

      {showReels && reelCount > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 16 }}>
          {reels.map(r => (
            <a key={r.id} href={r.permalink} target="_blank" rel="noopener noreferrer" style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
              <div style={{ position: 'relative', paddingBottom: '150%', background: 'var(--surface-2)', borderRadius: 8, overflow: 'hidden', marginBottom: 4 }}>
                {r.thumbnail_url && (
                  <img src={`/api/proxy-image?url=${encodeURIComponent(r.thumbnail_url)}`} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
              </div>
              <div style={{ fontSize: 10.5, color: 'var(--text-muted)', display: 'flex', gap: 6 }}>
                <span>👁 {formatNumber(r.views || 0)}</span>
                <span>♥ {formatNumber(r.likes || 0)}</span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
