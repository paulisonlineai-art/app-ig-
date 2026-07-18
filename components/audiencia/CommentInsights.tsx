'use client'

import { useState } from 'react'

type Reel = { caption: string; permalink: string; views: number; comments: number; thumbnail_url?: string }

export default function CommentInsights({ reels }: { reels: Reel[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [meta, setMeta] = useState<{ commentCount: number; reelCount: number } | null>(null)

  const toggle = (permalink: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(permalink)) next.delete(permalink)
      else if (next.size < 10) next.add(permalink)
      return next
    })
  }

  const selectAll = () => {
    if (selected.size === reels.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(reels.slice(0, 10).map(r => r.permalink)))
    }
  }

  const analyze = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/ai/comment-ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permalinks: selected.size > 0 ? [...selected] : undefined }),
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        setResult(data.result)
        setMeta({ commentCount: data.commentCount, reelCount: data.reelCount })
      }
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const reelsWithComments = reels.filter(r => r.comments > 0 && r.permalink)

  return (
    <div className="card" style={{ padding: 20, marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <span style={{ fontSize: 20 }}>💬</span>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 800 }}>Ideas desde Comentarios</h2>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Elegí de qué reels querés analizar los comentarios
          </p>
        </div>
      </div>

      {reelsWithComments.length > 0 ? (
        <>
          {/* Reel selector */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
                SELECCIONÁ REELS ({selected.size} de {Math.min(10, reelsWithComments.length)})
              </span>
              <button
                onClick={selectAll}
                style={{ fontSize: 11, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
              >
                {selected.size === reelsWithComments.length ? 'Deseleccionar todo' : 'Seleccionar todo'}
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 280, overflowY: 'auto' }}>
              {reelsWithComments.map(r => {
                const isSelected = selected.has(r.permalink)
                return (
                  <button
                    key={r.permalink}
                    onClick={() => toggle(r.permalink)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      background: isSelected ? 'var(--accent-light)' : 'var(--surface-2)',
                      border: isSelected ? '1.5px solid var(--accent)' : '1.5px solid var(--border)',
                      borderRadius: 10, padding: '8px 12px',
                      cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                    }}
                  >
                    <div style={{
                      width: 20, height: 20, borderRadius: 5, flexShrink: 0,
                      background: isSelected ? 'var(--accent)' : 'var(--surface)',
                      border: isSelected ? 'none' : '2px solid var(--border-strong)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontSize: 12, fontWeight: 700,
                    }}>
                      {isSelected && '✓'}
                    </div>
                    {r.thumbnail_url && (
                      <img
                        src={`/api/proxy-image?url=${encodeURIComponent(r.thumbnail_url)}`}
                        style={{ width: 36, height: 48, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }}
                        alt=""
                      />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text)' }}>
                        {r.caption?.split('\n')[0]?.slice(0, 70) || '(sin caption)'}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                        {r.comments} comentarios · {r.views?.toLocaleString()} views
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <button
            onClick={analyze}
            disabled={loading || selected.size === 0}
            className="btn btn-primary"
            style={{ width: '100%', marginBottom: result || error ? 16 : 0 }}
          >
            {loading
              ? '⏳ Scrapeando comentarios y analizando...'
              : result
                ? '🔄 Volver a analizar'
                : `💬 Analizar comentarios de ${selected.size || 0} reel${selected.size !== 1 ? 's' : ''}`}
          </button>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: 13 }}>
          No hay reels con comentarios para analizar. Sincronizá tus reels primero.
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>💬</div>
          <p style={{ fontSize: 13 }}>Leyendo comentarios reales de tus reels...</p>
          <p style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 4 }}>Esto puede tomar hasta 2 minutos</p>
        </div>
      )}

      {error && (
        <div style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--danger)' }}>
          {error}
        </div>
      )}

      {result && !loading && (
        <>
          {meta && (
            <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
              <div style={{ background: 'var(--surface-2)', borderRadius: 8, padding: '8px 14px', fontSize: 12 }}>
                <span style={{ fontWeight: 700 }}>{meta.commentCount}</span>
                <span style={{ color: 'var(--text-muted)' }}> comentarios analizados</span>
              </div>
              <div style={{ background: 'var(--surface-2)', borderRadius: 8, padding: '8px 14px', fontSize: 12 }}>
                <span style={{ fontWeight: 700 }}>{meta.reelCount}</span>
                <span style={{ color: 'var(--text-muted)' }}> reels escaneados</span>
              </div>
            </div>
          )}
          <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, fontSize: 13.5, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
            {result}
          </div>
        </>
      )}
    </div>
  )
}
