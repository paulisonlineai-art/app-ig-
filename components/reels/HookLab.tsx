'use client'

import { useState } from 'react'

type Reel = {
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

type HookType = { type: string; count: number; avg_multiplier: number; best_hook: string; verdict: string }
type TopHook = { hook: string; multiplier: number; why: string }
type Analysis = {
  hook_types: HookType[]
  top_hooks: TopHook[]
  worst_hooks: TopHook[]
  golden_rules: string[]
  summary: string
}

export default function HookLab({ reels }: { reels: Reel[] }) {
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [variations, setVariations] = useState('')
  const [loading, setLoading] = useState(false)
  const [genLoading, setGenLoading] = useState(false)
  const [hookInput, setHookInput] = useState('')
  const [topic, setTopic] = useState('')
  const [selectedHook, setSelectedHook] = useState(0)
  const [tab, setTab] = useState<'analysis' | 'generate'>('analysis')
  const [inputMode, setInputMode] = useState<'write' | 'reel'>('write')
  const [showReelPicker, setShowReelPicker] = useState(false)
  const [selectedReel, setSelectedReel] = useState<Reel | null>(null)

  const analyze = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/ai/hook-lab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'analyze' }),
      })
      const data = await res.json()
      if (data.analysis) setAnalysis(data.analysis)
    } catch { /* ignore */ } finally {
      setLoading(false)
    }
  }

  const generate = async () => {
    setGenLoading(true)
    try {
      const hookToAnalyze = inputMode === 'write' ? hookInput : (selectedReel?.hook || selectedReel?.caption?.slice(0, 100) || '')
      const res = await fetch('/api/ai/hook-lab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate',
          hookIndex: selectedHook,
          topic,
          customHook: hookToAnalyze || undefined,
        }),
      })
      const data = await res.json()
      if (data.variations) setVariations(data.variations)
    } catch { /* ignore */ } finally {
      setGenLoading(false)
    }
  }

  const sortedReels = [...reels]
    .filter(r => r.hook || r.caption)
    .sort((a, b) => b.multiplier - a.multiplier)
    .slice(0, 30)

  const pickReel = (reel: Reel) => {
    setSelectedReel(reel)
    setHookInput(reel.hook || reel.caption?.slice(0, 100) || '')
    setShowReelPicker(false)
  }

  const multColor = (m: number) => m >= 1.5 ? '#059669' : m >= 1 ? 'var(--text)' : '#dc2626'

  return (
    <div>
      <div className="tab-bar">
        {[
          { key: 'analysis' as const, label: '📊 Análisis de Hooks' },
          { key: 'generate' as const, label: '✨ Generar Variaciones' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`tab-bar-item ${tab === t.key ? 'tab-bar-item-active' : ''}`}
          >{t.label}</button>
        ))}
      </div>

      {tab === 'analysis' && (
        <>
          <div className="reel-list" style={{ marginBottom: 20 }}>
            <div className="section-label-sm" style={{ marginBottom: 4 }}>
              TUS REELS Y SUS HOOKS ({sortedReels.length})
            </div>
            {sortedReels.map((r, i) => (
              <div key={i} className="reel-list-item">
                {r.thumbnail_url && (
                  <img src={`/api/proxy-image?url=${encodeURIComponent(r.thumbnail_url)}`} alt="" className="reel-list-thumb" />
                )}
                <div className="reel-list-text">
                  <div className="reel-list-title">
                    {r.hook ? `"${r.hook}"` : r.caption?.slice(0, 60) || '(sin hook)'}
                  </div>
                  {r.hook && r.caption && (
                    <div className="reel-list-sub">{r.caption.slice(0, 70)}</div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 10, flexShrink: 0, alignItems: 'center' }}>
                  <div className="mini-metric">
                    <div className="mini-metric-value">{r.views.toLocaleString()}</div>
                    <div className="mini-metric-label">views</div>
                  </div>
                  <div className="mini-metric">
                    <div className="mini-metric-value" style={{ fontSize: 13, fontWeight: 800, color: multColor(r.multiplier) }}>{r.multiplier.toFixed(1)}x</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button onClick={analyze} disabled={loading} className="btn btn-primary" style={{ width: '100%', marginBottom: analysis ? 16 : 0 }}>
            {loading ? '⏳ Analizando patrones...' : analysis ? '🔄 Regenerar análisis IA' : '🪝 Analizar patrones con IA'}
          </button>

          {analysis && (
            <>
              <div className="info-banner info-banner-accent">{analysis.summary}</div>

              <div style={{ marginBottom: 16 }}>
                <div className="section-label-sm">RENDIMIENTO POR TIPO DE HOOK</div>
                {analysis.hook_types
                  .sort((a, b) => b.avg_multiplier - a.avg_multiplier)
                  .map((ht, i) => (
                    <div key={ht.type} className="ranked-item" style={{ borderBottom: i < analysis.hook_types.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <div className="ranked-badge" style={{ background: i === 0 ? '#059669' : i === 1 ? '#d97706' : 'var(--surface-2)', color: i < 2 ? 'white' : 'var(--text-muted)' }}>
                        {i + 1}
                      </div>
                      <div className="reel-list-text">
                        <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'capitalize' }}>{ht.type.replace(/_/g, ' ')}</div>
                        <div className="reel-list-sub">{ht.verdict}</div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: multColor(ht.avg_multiplier) }}>{ht.avg_multiplier.toFixed(1)}x</div>
                        <div className="mini-metric-label">{ht.count} reels</div>
                      </div>
                    </div>
                  ))}
              </div>

              <div className="hook-card-grid" style={{ marginBottom: 16 }}>
                <div className="hook-card hook-card-success">
                  <div className="section-label-xs" style={{ color: '#059669' }}>TOP HOOKS</div>
                  {analysis.top_hooks.map((h, i) => (
                    <div key={i} style={{ marginBottom: 8 }}>
                      <div className="hook-quote">&ldquo;{h.hook}&rdquo;</div>
                      <div className="hook-meta">{h.multiplier.toFixed(1)}x — {h.why}</div>
                    </div>
                  ))}
                </div>
                <div className="hook-card hook-card-danger">
                  <div className="section-label-xs" style={{ color: '#dc2626' }}>HOOKS QUE NO FUNCIONARON</div>
                  {analysis.worst_hooks.map((h, i) => (
                    <div key={i} style={{ marginBottom: 8 }}>
                      <div className="hook-quote">&ldquo;{h.hook}&rdquo;</div>
                      <div className="hook-meta">{h.multiplier.toFixed(1)}x — {h.why}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="hook-card-neutral">
                <div className="section-label-xs">REGLAS DE ORO DE TUS HOOKS</div>
                {analysis.golden_rules.map((r, i) => (
                  <div key={i} style={{ fontSize: 12, marginBottom: 4 }}>⭐ {r}</div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {tab === 'generate' && (
        <>
          <div style={{ marginBottom: 16 }}>
            <div className="section-label-sm">¿DE DÓNDE SALE EL HOOK?</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => { setInputMode('write'); setSelectedReel(null); setShowReelPicker(false) }}
                className={`mode-btn ${inputMode === 'write' ? 'mode-btn-active' : 'mode-btn-inactive'}`}
              >✍️ Escribir hook</button>
              <button
                onClick={() => { setInputMode('reel'); setShowReelPicker(true) }}
                className={`mode-btn ${inputMode === 'reel' ? 'mode-btn-active' : 'mode-btn-inactive'}`}
              >🎬 Elegir de mis reels</button>
            </div>
          </div>

          {inputMode === 'write' && (
            <div style={{ marginBottom: 16 }}>
              <label className="form-label">ESCRIBE TU HOOK</label>
              <textarea
                value={hookInput}
                onChange={e => setHookInput(e.target.value)}
                placeholder="Ej: 'Esto es lo que nadie te dice sobre vender en Instagram...'"
                rows={3}
                style={{ width: '100%', resize: 'vertical', fontFamily: 'inherit' }}
              />
            </div>
          )}

          {inputMode === 'reel' && selectedReel && !showReelPicker && (
            <div className="reel-list-item" style={{ marginBottom: 16, border: '1px solid var(--border)' }}>
              {selectedReel.thumbnail_url && (
                <img src={`/api/proxy-image?url=${encodeURIComponent(selectedReel.thumbnail_url)}`} alt="" style={{ width: 40, height: 56, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
              )}
              <div className="reel-list-text">
                <div className="reel-list-title">{selectedReel.caption?.slice(0, 80) || '(sin caption)'}</div>
                <div className="reel-list-sub">Hook: &ldquo;{selectedReel.hook || '?'}&rdquo; · {selectedReel.views.toLocaleString()} views</div>
              </div>
              <button onClick={() => setShowReelPicker(true)} className="btn btn-ghost" style={{ padding: '6px 10px', fontSize: 11 }}>
                Cambiar
              </button>
            </div>
          )}

          {inputMode === 'reel' && showReelPicker && (
            <div className="picker-list" style={{ marginBottom: 16 }}>
              <div className="picker-list-header">ELIGE UN REEL PARA ANALIZAR SU HOOK</div>
              {reels.filter(r => r.hook || r.caption).map((r, i) => (
                <button key={i} onClick={() => pickReel(r)} className="picker-list-item">
                  {r.thumbnail_url && (
                    <img src={`/api/proxy-image?url=${encodeURIComponent(r.thumbnail_url)}`} alt="" className="reel-list-thumb-sm" />
                  )}
                  <div className="reel-list-text">
                    <div className="reel-list-title" style={{ color: 'var(--text)' }}>{r.caption?.slice(0, 70) || '(sin caption)'}</div>
                    <div className="reel-list-sub">Hook: &ldquo;{r.hook || '?'}&rdquo;</div>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>
                    {r.views.toLocaleString()} views
                  </div>
                </button>
              ))}
            </div>
          )}

          {!hookInput && !selectedReel && analysis && (
            <div style={{ marginBottom: 12 }}>
              <label className="form-label">O USA UN TOP HOOK TUYO</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {[0, 1, 2, 3, 4].map(i => (
                  <button
                    key={i}
                    onClick={() => setSelectedHook(i)}
                    className={`pill ${selectedHook === i ? 'pill-active' : 'pill-inactive'}`}
                    style={{ fontSize: 11 }}
                  >Top #{i + 1}</button>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label className="form-label">TEMA NUEVO (opcional)</label>
            <input
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="Ej: cómo conseguir clientes con contenido"
              style={{ width: '100%' }}
            />
          </div>

          <button
            onClick={generate}
            disabled={genLoading || (!hookInput && !selectedReel && !analysis)}
            className="btn btn-primary"
            style={{ width: '100%', marginBottom: variations ? 16 : 0 }}
          >
            {genLoading ? '⏳ Generando variaciones...' : '✨ Generar 10 variaciones'}
          </button>

          {variations && <div className="ai-result">{variations}</div>}
        </>
      )}
    </div>
  )
}
