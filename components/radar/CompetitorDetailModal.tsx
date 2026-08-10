'use client'
import { useState } from 'react'
import { Bookmark, Sparkles } from 'lucide-react'
import ProfileAvatar from '@/components/ProfileAvatar'
import { formatNumber } from '@/lib/utils'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import type { Competitor, CompetitorReel } from '@/types'

interface Props {
  competitor: Competitor
  reels: CompetitorReel[]
  onClose: () => void
}

export default function CompetitorDetailModal({ competitor, reels, onClose }: Props) {
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set(reels.filter((r) => r.saved).map((r) => r.id)))
  const [adapting, setAdapting] = useState<Record<string, boolean>>({})
  const [adaptations, setAdaptations] = useState<Record<string, string>>({})
  const [adaptErrors, setAdaptErrors] = useState<Record<string, string>>({})

  const toggleSave = async (reelId: string) => {
    const willSave = !savedIds.has(reelId)
    setSavedIds((prev) => {
      const next = new Set(prev)
      willSave ? next.add(reelId) : next.delete(reelId)
      return next
    })
    try {
      await fetch('/api/competitors/reels/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reelId, saved: willSave }),
      })
    } catch {
      setSavedIds((prev) => {
        const next = new Set(prev)
        willSave ? next.delete(reelId) : next.add(reelId)
        return next
      })
    }
  }

  const adapt = async (reelId: string) => {
    setAdapting((p) => ({ ...p, [reelId]: true }))
    setAdaptErrors((p) => ({ ...p, [reelId]: '' }))
    try {
      const res = await fetch('/api/competitors/reels/adapt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reelId }),
      })
      const data = await res.json()
      if (!res.ok || data.error) setAdaptErrors((p) => ({ ...p, [reelId]: data.error || 'Error al adaptar' }))
      else setAdaptations((p) => ({ ...p, [reelId]: data.adaptation }))
    } catch {
      setAdaptErrors((p) => ({ ...p, [reelId]: 'Error de conexión' }))
    } finally {
      setAdapting((p) => ({ ...p, [reelId]: false }))
    }
  }

  return (
    <Modal title={`@${competitor.ig_username}`} onClose={onClose} maxWidth={720}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
        <ProfileAvatar accountId={competitor.id} type="competitor" username={competitor.ig_username} size={56} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>@{competitor.ig_username}</div>
          {competitor.followers_count != null && (
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{formatNumber(competitor.followers_count)} seguidores</div>
          )}
          {competitor.bio && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, maxWidth: 420 }}>{competitor.bio}</p>}
        </div>
      </div>

      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Reels recientes ({reels.length})
      </div>

      <div style={{ maxHeight: 460, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {reels.map((r) => (
          <div key={r.id} style={{ display: 'flex', gap: 12, border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 12 }}>
            <div style={{ width: 64, height: 96, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: 'var(--surface-2)' }}>
              {r.thumbnail_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`/api/proxy-image?url=${encodeURIComponent(r.thumbnail_url)}`}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  fontSize: 12, color: 'var(--text)', lineHeight: 1.4,
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: 6,
                }}
              >
                {r.caption || 'Sin descripción'}
              </p>
              <div style={{ display: 'flex', gap: 10, fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>
                <span>{formatNumber(r.views || 0)} vistas</span>
                <span>{formatNumber(r.likes || 0)} likes</span>
                <span>{formatNumber(r.comments || 0)} comentarios</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Button size="xs" variant={savedIds.has(r.id) ? 'primary' : 'secondary'} leftIcon={Bookmark} onClick={() => toggleSave(r.id)}>
                  {savedIds.has(r.id) ? 'Guardado' : 'Guardar'}
                </Button>
                <Button size="xs" variant="outline" leftIcon={Sparkles} loading={adapting[r.id]} onClick={() => adapt(r.id)}>
                  Adaptar con IA
                </Button>
              </div>
              {adaptErrors[r.id] && <p style={{ fontSize: 11, color: 'var(--danger)', marginTop: 6 }}>{adaptErrors[r.id]}</p>}
              {adaptations[r.id] && (
                <div className="ai-result" style={{ marginTop: 8, fontSize: 12, maxHeight: 160, overflowY: 'auto' }}>{adaptations[r.id]}</div>
              )}
            </div>
          </div>
        ))}
        {reels.length === 0 && <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Sin reels sincronizados todavía.</p>}
      </div>
    </Modal>
  )
}
