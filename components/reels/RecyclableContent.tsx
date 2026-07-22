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
      <div className="card" style={{ padding: 40, textAlign: 'center' }}>
        <span style={{ fontSize: 32, display: 'block', marginBottom: 8 }}>♻️</span>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>No hay contenido reciclable</div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Todos tus reels con buen engagement ya tienen buenas views.</p>
      </div>
    )
  }

  return (
    <div>
      <div style={{ background: 'rgba(37,99,235,0.06)', border: '1px solid rgba(37,99,235,0.15)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
        <strong style={{ color: '#2563eb' }}>Contenido valioso enterrado.</strong> Estos reels tuvieron alto save rate o comment rate (la gente los valoró) pero pocas views (el algoritmo no los distribuyó). El contenido es bueno — el hook o timing fallaron. Seleccioná los que querés reciclar.
      </div>

      {/* Select all / count */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
        {recyclable.map((r, i) => {
          const isSelected = selected.has(i)
          return (
            <div
              key={i}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: 12,
                background: isSelected ? 'var(--accent-light)' : 'var(--surface-2)',
                borderRadius: 10,
                border: isSelected ? '1px solid var(--accent)' : '1px solid transparent',
                transition: 'all 0.15s',
              }}
            >
              {/* Select button */}
              <button
                onClick={() => toggleSelect(i)}
                style={{
                  width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isSelected ? 'var(--accent)' : 'var(--surface)',
                  border: isSelected ? 'none' : '2px solid var(--border)',
                  color: 'white', fontSize: 14, cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {isSelected ? '✓' : ''}
              </button>

              {r.thumbnail_url && (
                <img
                  src={`/api/proxy-image?url=${encodeURIComponent(r.thumbnail_url)}`}
                  alt=""
                  style={{ width: 40, height: 56, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }}
                />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {r.caption?.slice(0, 80) || '(sin caption)'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  Hook: "{r.hook || '?'}"
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#dc2626' }}>{r.views.toLocaleString()}</div>
                  <div style={{ fontSize: 9, color: 'var(--text-faint)' }}>views</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#059669' }}>{r.save_rate.toFixed(1)}%</div>
                  <div style={{ fontSize: 9, color: 'var(--text-faint)' }}>saves</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#8b5cf6' }}>{r.comment_rate.toFixed(1)}%</div>
                  <div style={{ fontSize: 9, color: 'var(--text-faint)' }}>comments</div>
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

      {suggestions && !loading && (
        <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, fontSize: 13.5, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
          {suggestions}
        </div>
      )}
    </div>
  )
}
