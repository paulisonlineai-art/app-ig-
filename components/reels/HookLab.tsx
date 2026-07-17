'use client'

import { useState } from 'react'

type HookType = { type: string; count: number; avg_multiplier: number; best_hook: string; verdict: string }
type TopHook = { hook: string; multiplier: number; why: string }
type Analysis = {
  hook_types: HookType[]
  top_hooks: TopHook[]
  worst_hooks: TopHook[]
  golden_rules: string[]
  summary: string
}

export default function HookLab() {
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [variations, setVariations] = useState('')
  const [loading, setLoading] = useState(false)
  const [genLoading, setGenLoading] = useState(false)
  const [topic, setTopic] = useState('')
  const [selectedHook, setSelectedHook] = useState(0)
  const [expanded, setExpanded] = useState(true)
  const [tab, setTab] = useState<'analysis' | 'generate'>('analysis')

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
      const res = await fetch('/api/ai/hook-lab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate', hookIndex: selectedHook, topic }),
      })
      const data = await res.json()
      if (data.variations) setVariations(data.variations)
    } catch { /* ignore */ } finally {
      setGenLoading(false)
    }
  }

  return (
    <div className="card" style={{ padding: 20, marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: expanded ? 16 : 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>🪝</span>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 800 }}>Laboratorio de Hooks</h2>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Analizá qué tipo de hook te funciona y generá variaciones ganadoras</p>
          </div>
        </div>
        <button onClick={() => setExpanded(!expanded)} style={{ background: 'none', border: 'none', fontSize: 16, color: 'var(--text-muted)', cursor: 'pointer' }}>
          {expanded ? '▲' : '▼'}
        </button>
      </div>

      {expanded && (
        <>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: 'var(--surface-2)', borderRadius: 8, padding: 3 }}>
            {[
              { key: 'analysis' as const, label: '📊 Análisis de Hooks' },
              { key: 'generate' as const, label: '✨ Generar Variaciones' },
            ].map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  flex: 1, padding: '8px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  background: tab === t.key ? 'var(--surface)' : 'transparent',
                  color: tab === t.key ? 'var(--text)' : 'var(--text-muted)',
                  border: tab === t.key ? '1px solid var(--border)' : '1px solid transparent',
                  boxShadow: tab === t.key ? 'var(--shadow-sm)' : 'none',
                }}
              >{t.label}</button>
            ))}
          </div>

          {tab === 'analysis' && (
            <>
              {!analysis ? (
                <button onClick={analyze} disabled={loading} className="btn btn-primary" style={{ width: '100%' }}>
                  {loading ? '⏳ Analizando todos tus hooks...' : '🪝 Analizar mis hooks'}
                </button>
              ) : (
                <>
                  <div style={{ background: 'var(--accent-light)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>
                    {analysis.summary}
                  </div>

                  {/* Hook types ranking */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8 }}>RENDIMIENTO POR TIPO DE HOOK</div>
                    {analysis.hook_types
                      .sort((a, b) => b.avg_multiplier - a.avg_multiplier)
                      .map((ht, i) => (
                        <div key={ht.type} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < analysis.hook_types.length - 1 ? '1px solid var(--border)' : 'none' }}>
                          <div style={{ width: 28, height: 28, borderRadius: 6, background: i === 0 ? '#059669' : i === 1 ? '#d97706' : 'var(--surface-2)', color: i < 2 ? 'white' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                            {i + 1}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'capitalize' }}>{ht.type.replace(/_/g, ' ')}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{ht.verdict}</div>
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div style={{ fontSize: 14, fontWeight: 800, color: ht.avg_multiplier >= 1.5 ? '#059669' : ht.avg_multiplier >= 1 ? 'var(--text)' : '#dc2626' }}>{ht.avg_multiplier.toFixed(1)}x</div>
                            <div style={{ fontSize: 10, color: 'var(--text-faint)' }}>{ht.count} reels</div>
                          </div>
                        </div>
                      ))}
                  </div>

                  {/* Top & worst hooks */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                    <div style={{ background: 'rgba(5,150,105,0.06)', border: '1px solid rgba(5,150,105,0.15)', borderRadius: 10, padding: 14 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#059669', marginBottom: 8 }}>TOP HOOKS</div>
                      {analysis.top_hooks.map((h, i) => (
                        <div key={i} style={{ marginBottom: 8 }}>
                          <div style={{ fontSize: 12, fontWeight: 600 }}>"{h.hook}"</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{h.multiplier.toFixed(1)}x — {h.why}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.15)', borderRadius: 10, padding: 14 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#dc2626', marginBottom: 8 }}>HOOKS QUE NO FUNCIONARON</div>
                      {analysis.worst_hooks.map((h, i) => (
                        <div key={i} style={{ marginBottom: 8 }}>
                          <div style={{ fontSize: 12, fontWeight: 600 }}>"{h.hook}"</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{h.multiplier.toFixed(1)}x — {h.why}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Golden rules */}
                  <div style={{ background: 'var(--surface-2)', borderRadius: 10, padding: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8 }}>REGLAS DE ORO DE TUS HOOKS</div>
                    {analysis.golden_rules.map((r, i) => (
                      <div key={i} style={{ fontSize: 12, marginBottom: 4 }}>⭐ {r}</div>
                    ))}
                  </div>

                  <button onClick={analyze} disabled={loading} style={{ marginTop: 12, background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 14px', fontSize: 12, color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 600 }}>
                    🔄 Regenerar análisis
                  </button>
                </>
              )}
            </>
          )}

          {tab === 'generate' && (
            <>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>HOOK BASE (tu hook ganador a variar)</label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {[0, 1, 2, 3, 4].map(i => (
                    <button
                      key={i}
                      onClick={() => setSelectedHook(i)}
                      style={{
                        padding: '6px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                        background: selectedHook === i ? 'var(--accent)' : 'var(--surface-2)',
                        color: selectedHook === i ? 'white' : 'var(--text-muted)',
                        border: selectedHook === i ? 'none' : '1px solid var(--border)',
                      }}
                    >Top #{i + 1}</button>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>TEMA NUEVO (opcional)</label>
                <input
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  placeholder="Ej: cómo conseguir clientes con contenido"
                  style={{ width: '100%', padding: '10px 14px', fontSize: 13, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text)' }}
                />
              </div>
              <button onClick={generate} disabled={genLoading} className="btn btn-primary" style={{ width: '100%', marginBottom: variations ? 16 : 0 }}>
                {genLoading ? '⏳ Generando variaciones...' : '✨ Generar 10 variaciones'}
              </button>
              {variations && (
                <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, fontSize: 13, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                  {variations}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
