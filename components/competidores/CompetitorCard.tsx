'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatNumber } from '@/lib/utils'
import ProfileAvatar from '@/components/ProfileAvatar'
import type { Competitor, CompetitorReel } from '@/types'

interface Props {
  competitor: Competitor & { competitor_reels: CompetitorReel[] }
}

export default function CompetitorCard({ competitor }: Props) {
  const router = useRouter()
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState('')
  const [showReels, setShowReels] = useState(false)
  const [showSavedOnly, setShowSavedOnly] = useState(false)
  const [savedIds, setSavedIds] = useState<Set<string>>(
    new Set((competitor.competitor_reels || []).filter(r => r.saved).map(r => r.id))
  )

  const toggleSave = async (e: React.MouseEvent, reelId: string) => {
    e.preventDefault()
    e.stopPropagation()
    const willBeSaved = !savedIds.has(reelId)
    setSavedIds(prev => {
      const next = new Set(prev)
      willBeSaved ? next.add(reelId) : next.delete(reelId)
      return next
    })
    try {
      await fetch('/api/competitors/reels/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reelId, saved: willBeSaved }),
      })
    } catch {
      setSavedIds(prev => {
        const next = new Set(prev)
        willBeSaved ? next.delete(reelId) : next.add(reelId)
        return next
      })
    }
  }

  const sync = async (expandBy?: number) => {
    setSyncing(true)
    setError('')
    try {
      const res = await fetch('/api/competitors/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ competitorId: competitor.id, expandBy }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setError(data.error || 'Error al sincronizar')
        return
      }
      setShowReels(true)
      router.refresh()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al sincronizar')
    } finally {
      setSyncing(false)
    }
  }

  const reels = competitor.competitor_reels || []
  const reelCount = reels.length

  return (
    <div className="kpi-card" style={{ padding: 20 }}>
      <div className="settings-account" style={{ marginBottom: 16 }}>
        <ProfileAvatar accountId={competitor.id} type="competitor" username={competitor.ig_username} size={48} />
        <div>
          <div className="settings-username">@{competitor.ig_username}</div>
          {competitor.followers_count ? (
            <div className="settings-followers">{competitor.followers_count.toLocaleString()} seguidores</div>
          ) : null}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button
          onClick={() => reelCount > 0 && setShowReels(s => !s)}
          disabled={reelCount === 0}
          className="mini-stat-card" style={{ flex: 1, border: 'none', cursor: reelCount > 0 ? 'pointer' : 'default' }}
        >
          <div className="mini-stat-value">{reelCount}</div>
          <div className="mini-stat-label">Reels trackeados {reelCount > 0 ? (showReels ? '▲' : '▼') : ''}</div>
        </button>
        {competitor.last_synced_at && (
          <div className="mini-stat-card" style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 600 }}>
              {new Date(competitor.last_synced_at).toLocaleDateString('es')}
            </div>
            <div className="mini-stat-label">Última sync</div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => sync()} disabled={syncing} className="btn btn-primary" style={{ flex: 1 }}>
          {syncing ? '⏳ Sincronizando...' : '🔄 Sincronizar reels'}
        </button>
        <button
          onClick={() => sync(20)}
          disabled={syncing}
          title="Trae 20 reels virales más, sin perder los que ya trackeaste"
          className="btn btn-ghost" style={{ flex: 1 }}
        >
          ➕ Trackear más reels
        </button>
      </div>

      {error && <p style={{ fontSize: 12, color: 'var(--danger)', marginTop: 8 }}>{error}</p>}

      {showReels && reelCount > 0 && (
        <>
          {savedIds.size > 0 && (
            <button
              onClick={() => setShowSavedOnly(s => !s)}
              className={`pill ${showSavedOnly ? 'pill-active' : 'pill-inactive'}`}
              style={{ marginTop: 16, fontSize: 11.5 }}
            >
              ⭐ Guardados ({savedIds.size}){showSavedOnly ? ' ✕' : ''}
            </button>
          )}
          <div className="grid-comp-reels" style={{ marginTop: showSavedOnly || savedIds.size === 0 ? 16 : 8 }}>
            {(showSavedOnly ? reels.filter(r => savedIds.has(r.id)) : reels).map(r => (
              <a key={r.id} href={`/competidores/reels/${r.id}`} style={{ display: 'block' }}>
                <div className="comp-reel-thumb">
                  {r.thumbnail_url && (
                    <img src={`/api/proxy-image?url=${encodeURIComponent(r.thumbnail_url)}`} alt={`Reel de @${competitor.ig_username}`} />
                  )}
                  <button
                    onClick={e => toggleSave(e, r.id)}
                    title={savedIds.has(r.id) ? 'Quitar de guardados' : 'Guardar para más adelante'}
                    className="comp-reel-save"
                  >
                    {savedIds.has(r.id) ? '⭐' : '☆'}
                  </button>
                </div>
                <div className="comp-reel-stats">
                  <span>👁 {formatNumber(r.views || 0)}</span>
                  <span>♥ {formatNumber(r.likes || 0)}</span>
                </div>
              </a>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
