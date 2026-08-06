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
      <div className="collapse-header-left" style={{ marginBottom: 16 }}>
        <span className="collapse-header-icon">💬</span>
        <div>
          <h2 className="collapse-header-title">Ideas desde Comentarios</h2>
          <p className="collapse-header-desc">
            Elegí de qué reels querés analizar los comentarios
          </p>
        </div>
      </div>

      {reelsWithComments.length > 0 ? (
        <>
          <div style={{ marginBottom: 16 }}>
            <div className="section-header-row" style={{ marginBottom: 8 }}>
              <span className="section-label-sm" style={{ marginBottom: 0, letterSpacing: '0.08em' }}>
                SELECCIONÁ REELS ({selected.size} de {Math.min(10, reelsWithComments.length)})
              </span>
              <button
                onClick={selectAll}
                style={{ fontSize: 11, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
              >
                {selected.size === reelsWithComments.length ? 'Deseleccionar todo' : 'Seleccionar todo'}
              </button>
            </div>
            <div className="reel-list" style={{ maxHeight: 280, overflowY: 'auto' }}>
              {reelsWithComments.map(r => {
                const isSelected = selected.has(r.permalink)
                return (
                  <button
                    key={r.permalink}
                    onClick={() => toggle(r.permalink)}
                    className={`reel-list-item ${isSelected ? 'reel-list-item-selected' : ''}`}
                    style={{ cursor: 'pointer', textAlign: 'left', border: isSelected ? undefined : '1.5px solid var(--border)' }}
                  >
                    <div className={`check-toggle ${isSelected ? 'check-toggle-active' : ''}`}>
                      {isSelected && '✓'}
                    </div>
                    {r.thumbnail_url && (
                      <img src={`/api/proxy-image?url=${encodeURIComponent(r.thumbnail_url)}`} className="reel-list-thumb" alt="" />
                    )}
                    <div className="reel-list-text">
                      <div className="reel-list-title" style={{ color: 'var(--text)' }}>
                        {r.caption?.split('\n')[0]?.slice(0, 70) || '(sin caption)'}
                      </div>
                      <div className="reel-list-sub">
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

      {error && <div className="info-banner-error">{error}</div>}

      {result && !loading && (
        <>
          {meta && (
            <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
              <div className="mini-stat-card" style={{ padding: '8px 14px', fontSize: 12 }}>
                <span style={{ fontWeight: 700 }}>{meta.commentCount}</span>
                <span style={{ color: 'var(--text-muted)' }}> comentarios analizados</span>
              </div>
              <div className="mini-stat-card" style={{ padding: '8px 14px', fontSize: 12 }}>
                <span style={{ fontWeight: 700 }}>{meta.reelCount}</span>
                <span style={{ color: 'var(--text-muted)' }}> reels escaneados</span>
              </div>
            </div>
          )}
          <div className="ai-result">{result}</div>
        </>
      )}
    </div>
  )
}
