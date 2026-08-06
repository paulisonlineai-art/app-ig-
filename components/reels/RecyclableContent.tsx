'use client'

import { useState } from 'react'

type RecyclableReel = {
  caption: string | null
  hook: string | null
  views: number
  saves: number
  save_rate: number
  comment_rate: number
  multiplier: number
  permalink: string
  thumbnail_url: string | null
}

export default function RecyclableContent({ reels }: { reels: RecyclableReel[] }) {
  const [suggestions, setSuggestions] = useState('')
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<Set<number>>(new Set())

  const avgViews = reels.reduce((s, r) => s + r.views, 0) / (reels.length || 1)
  const recyclable = reels
    .filter(r => r.views < avgViews && (r.save_rate > 1 || r.comment_rate > 1))
    .sort((a, b) => (b.save_rate + b.comment_rate) - (a.save_rate + a.comment_rate))
    .slice(0, 12)

  const toggleSelect = (i: number) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
  }

  const selectAll = () => {
    if (selected.size === recyclable.length) setSelected(new Set())
    else setSelected(new Set(recyclable.map((_, i) => i)))
  }

  const selectedReels = recyclable.filter((_, i) => selected.has(i))

  const generateSuggestions = async () => {
    const toAnalyze = selectedReels.length > 0 ? selectedReels : recyclable
    setLoading(true)
    try {
      const res = await fetch('/api/ai/generate-ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Tengo reels que tuvieron BUEN ENGAGEMENT pero POCAS VIEWS (buen contenido, mala distribución). Necesito ideas para RECICLARLOS con hooks nuevos.

REELS RECICLABLES (alto save/comment rate, bajas views):
${toAnalyze.map((r, i) => `${i + 1}. "${r.caption?.slice(0, 120) || '(sin caption)'}"
   Hook original: "${r.hook || 'no detectado'}"
   Views: ${r.views.toLocaleString()} (${r.multiplier.toFixed(1)}x) | Save rate: ${r.save_rate.toFixed(1)}% | Comment rate: ${r.comment_rate.toFixed(1)}%`).join('\n\n')}

Para CADA reel reciclable:
1. Por qué el contenido es bueno (save rate / comment rate alto = la gente lo valora)
2. Por qué falló en distribución (probable problema de hook o timing)
3. NUEVO HOOK propuesto (que mantenga el contenido pero enganche más)
4. Ángulo diferente para re-grabar el mismo tema

Sé concreto y accionable.`,
        }),
      })
      const data = await res.json()
      if (data.result) setSuggestions(data.result)
    } catch { /* ignore */ } finally {
      setLoading(false)
    }
  }

  if (recyclable.length === 0) {
    return (
      <div className="card empty-state">
        <div className="empty-state-icon">♻️</div>
        <p className="empty-state-title">No hay contenido reciclable</p>
        <p className="empty-state-desc">Todos tus reels con buen engagement ya tienen buenas views.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="info-banner info-banner-blue">
        <strong style={{ color: '#2563eb' }}>Contenido valioso enterrado.</strong> Estos reels tuvieron alto save rate o comment rate (la gente los valoró) pero pocas views (el algoritmo no los distribuyó). El contenido es bueno — el hook o timing fallaron. Seleccioná los que querés reciclar.
      </div>

      <div className="section-header-row" style={{ marginBottom: 10 }}>
        <button
          onClick={selectAll}
          style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          {selected.size === recyclable.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
        </button>
        {selected.size > 0 && (
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
            {selected.size} seleccionado{selected.size !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div className="reel-list" style={{ gap: 8, marginBottom: 16 }}>
        {recyclable.map((r, i) => {
          const isSelected = selected.has(i)
          return (
            <div
              key={i}
              className={`reel-list-item ${isSelected ? 'reel-list-item-selected' : ''}`}
              style={{ padding: 12, border: isSelected ? undefined : '1px solid transparent' }}
            >
              <button
                onClick={() => toggleSelect(i)}
                className={`check-toggle check-toggle-lg ${isSelected ? 'check-toggle-active' : ''}`}
              >
                {isSelected ? '✓' : ''}
              </button>

              {r.thumbnail_url && (
                <img src={`/api/proxy-image?url=${encodeURIComponent(r.thumbnail_url)}`} alt="" style={{ width: 40, height: 56, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
              )}
              <div className="reel-list-text">
                <div className="reel-list-title">{r.caption?.slice(0, 80) || '(sin caption)'}</div>
                <div className="reel-list-sub">Hook: &ldquo;{r.hook || '?'}&rdquo;</div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <div className="mini-metric">
                  <div className="mini-metric-value" style={{ color: '#dc2626' }}>{r.views.toLocaleString()}</div>
                  <div className="mini-metric-label">views</div>
                </div>
                <div className="mini-metric">
                  <div className="mini-metric-value" style={{ color: '#059669' }}>{r.save_rate.toFixed(1)}%</div>
                  <div className="mini-metric-label">saves</div>
                </div>
                <div className="mini-metric">
                  <div className="mini-metric-value" style={{ color: '#8b5cf6' }}>{r.comment_rate.toFixed(1)}%</div>
                  <div className="mini-metric-label">comments</div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <button
        onClick={generateSuggestions}
        disabled={loading}
        className="btn btn-primary"
        style={{ width: '100%', marginBottom: suggestions ? 16 : 0 }}
      >
        {loading ? '⏳ Generando hooks nuevos...' : selected.size > 0 ? `♻️ Reciclar ${selected.size} reel${selected.size !== 1 ? 's' : ''} seleccionado${selected.size !== 1 ? 's' : ''}` : suggestions ? '🔄 Regenerar sugerencias' : '♻️ Reciclar todos'}
      </button>

      {suggestions && !loading && <div className="ai-result">{suggestions}</div>}
    </div>
  )
}
