'use client'
import { useState } from 'react'
import type { ReferenceVideo } from '@/types'

type Tab = 'transcripcion' | 'estructura' | 'adaptacion'

export default function ReferenceCard({ ref_, brandDNA, onDelete }: { ref_: ReferenceVideo; brandDNA: string; onDelete?: (id: string) => void }) {
  const [tab, setTab] = useState<Tab>('estructura')
  const [adapting, setAdapting] = useState(false)
  const [adaptation, setAdaptation] = useState(ref_.adaptation || '')
  const [adaptError, setAdaptError] = useState('')
  const [customAngle, setCustomAngle] = useState('')
  const [expanded, setExpanded] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm(`¿Borrar "${ref_.filename || 'este video'}"? No se puede deshacer.`)) return
    setDeleting(true)
    try {
      const res = await fetch('/api/referencias/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refId: ref_.id }),
      })
      const data = await res.json()
      if (!res.ok || data.error) { alert(data.error || 'Error al borrar'); return }
      onDelete?.(ref_.id)
    } finally {
      setDeleting(false)
    }
  }

  const generateAdaptation = async (angle?: string) => {
    setAdapting(true)
    setAdaptError('')
    setTab('adaptacion')
    try {
      const res = await fetch('/api/referencias/adapt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refId: ref_.id, angle: angle || '' }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setAdaptError(data.error || 'Error al adaptar')
        return
      }
      setAdaptation(data.adaptation || '')
    } catch (e: unknown) {
      setAdaptError(e instanceof Error ? e.message : 'Error al adaptar')
    } finally {
      setAdapting(false)
    }
  }

  let structure: { blocks?: { label?: string; duration?: string; content: string }[]; hook_type?: string; tone?: string; persuasion_technique?: string; cta?: string; desire_appealed?: string; ideal_duration?: string; wpm?: number; key_insights?: string[] } | null = null
  if (ref_.structure) {
    try {
      structure = typeof ref_.structure === 'string' ? JSON.parse(ref_.structure) : ref_.structure
    } catch { /* malformed JSON */ }
  }

  const ANGLES = ['Mismo tema, mi nicho', 'Hook replicado', 'Estructura exacta', 'Tono contrario', 'Caso de cliente']

  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      {/* Header */}
      <div onClick={() => setExpanded(e => !e)} className="collapse-header" style={{ padding: '16px 20px' }}>
        <div className="collapse-header-left">
          <span className="collapse-header-icon">🎬</span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {ref_.filename || 'Video sin nombre'}
            </div>
            <div style={{ display: 'flex', gap: 10, fontSize: 12, color: 'var(--text-muted)' }}>
              {ref_.referent_name && <span>👤 {ref_.referent_name}</span>}
              {ref_.duration_seconds && <span>⏱ {Math.floor(ref_.duration_seconds / 60)}:{String(ref_.duration_seconds % 60).padStart(2, '0')}</span>}
              <span>📅 {new Date(ref_.created_at).toLocaleDateString('es')}</span>
              {ref_.hook && <span style={{ color: 'var(--accent)', fontWeight: 600 }}>Hook detectado ✓</span>}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {adaptation && <span className="pill pill-active" style={{ fontSize: 11 }}>Adaptado ✓</span>}
          <button
            onClick={handleDelete}
            disabled={deleting}
            title="Borrar"
            className="collapse-toggle"
            style={{ opacity: deleting ? 0.5 : 1 }}
          >
            {deleting ? '⏳' : '🗑'}
          </button>
          <span className="collapse-toggle">{expanded ? '↑' : '↓'}</span>
        </div>
      </div>

      {expanded && (
        <div style={{ borderTop: '1px solid var(--border)' }}>
          {ref_.hook && (
            <div className="detail-highlight" style={{ margin: '0 20px', marginTop: 12, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span className="detail-highlight-label" style={{ background: 'var(--surface)', padding: '2px 7px', borderRadius: 4, flexShrink: 0, marginTop: 1 }}>HOOK</span>
              <p style={{ fontSize: 13, color: 'var(--accent-dark)', lineHeight: 1.5, fontStyle: 'italic' }}>"{ref_.hook}"</p>
            </div>
          )}

          <div className="tab-bar" style={{ borderBottom: '1px solid var(--border)', marginBottom: 0, borderRadius: 0, background: 'transparent', padding: 0 }}>
            {([['estructura', '📊 Estructura'], ['transcripcion', '📝 Transcripción'], ['adaptacion', '✨ Adaptación']] as [Tab, string][]).map(([t, l]) => (
              <button key={t} onClick={() => setTab(t)} className={`tab-bar-item ${tab === t ? 'tab-bar-item-active' : ''}`}>
                {l}
              </button>
            ))}
          </div>

          <div style={{ padding: '18px 20px' }}>
            {tab === 'estructura' && (
              <div>
                {structure ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <h3 className="detail-label" style={{ marginBottom: 12 }}>Estructura del video</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {(structure.blocks || []).map((block, i) => (
                          <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                            <div style={{ flexShrink: 0, width: 64, textAlign: 'center' }}>
                              <div style={{ fontSize: 10, fontWeight: 700, color: 'white', background: ['#7c3aed', '#2563eb', '#d97706', '#059669', '#dc2626'][i % 5], padding: '3px 6px', borderRadius: 4 }}>
                                {block.label || `Bloque ${i + 1}`}
                              </div>
                              {block.duration && <div className="stat-tile-sub">{block.duration}</div>}
                            </div>
                            <div className="detail-panel" style={{ flex: 1, padding: '8px 10px', fontSize: 12.5, lineHeight: 1.5 }}>
                              {block.content}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="detail-label" style={{ marginBottom: 12 }}>Ángulos y técnicas</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {[
                          { label: 'Tipo de hook', value: structure.hook_type },
                          { label: 'Tono', value: structure.tone },
                          { label: 'Técnica de persuasión', value: structure.persuasion_technique },
                          { label: 'CTA', value: structure.cta },
                          { label: 'Deseo apelado', value: structure.desire_appealed },
                          { label: 'Duración ideal', value: structure.ideal_duration },
                          { label: 'WPM estimado', value: structure.wpm ? `${structure.wpm} palabras/min` : null },
                        ].filter(x => x.value).map(x => (
                          <div key={x.label} style={{ display: 'flex', gap: 8, fontSize: 12.5 }}>
                            <span style={{ color: 'var(--text-muted)', flexShrink: 0, width: 150 }}>{x.label}</span>
                            <span style={{ fontWeight: 600 }}>{x.value}</span>
                          </div>
                        ))}
                      </div>

                      {structure.key_insights && structure.key_insights.length > 0 && (
                        <div style={{ marginTop: 14 }}>
                          <h3 className="detail-label" style={{ marginBottom: 8 }}>Insights clave</h3>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {structure.key_insights.map((insight, i) => (
                              <div key={i} style={{ display: 'flex', gap: 8, fontSize: 12.5 }}>
                                <span style={{ color: 'var(--accent)', flexShrink: 0 }}>→</span>
                                <span>{insight}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontSize: 13, fontStyle: 'italic' }}>Sin análisis de estructura disponible</p>
                )}

                <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Adaptá este video a tu contenido:</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                    {ANGLES.map(angle => (
                      <button key={angle} onClick={() => generateAdaptation(angle)} disabled={adapting} className="btn btn-ghost" style={{ fontSize: 12, padding: '7px 12px' }}>{angle}</button>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input value={customAngle} onChange={e => setCustomAngle(e.target.value)} placeholder="O escribí un ángulo personalizado..." style={{ flex: 1, fontSize: 13 }} />
                    <button onClick={() => generateAdaptation(customAngle)} disabled={adapting || !customAngle.trim()} className="btn btn-primary" style={{ fontSize: 13 }}>
                      {adapting ? '⏳' : '✨ Adaptar'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {tab === 'transcripcion' && (
              <div>
                <div className="section-header-row" style={{ marginBottom: 12 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>Transcripción completa</span>
                  {ref_.transcript && (
                    <button onClick={() => navigator.clipboard.writeText(ref_.transcript || '')} className="btn btn-ghost" style={{ fontSize: 12, padding: '5px 10px' }}>📋 Copiar</button>
                  )}
                </div>
                {ref_.transcript ? (
                  <div className="ai-result" style={{ maxHeight: 400, overflowY: 'auto' }}>{ref_.transcript}</div>
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: 13 }}>Sin transcripción disponible</p>
                )}
                {ref_.transcript && (
                  <div className="stat-tile-sub" style={{ marginTop: 10, fontSize: 12 }}>
                    {ref_.transcript.split(' ').length} palabras · {Math.ceil(ref_.transcript.split(' ').length / 150)} min de lectura
                  </div>
                )}
              </div>
            )}

            {tab === 'adaptacion' && (
              <div>
                {adapting ? (
                  <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: 32, marginBottom: 12 }}>✨</div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>Klar está adaptando el contenido...</div>
                    <div className="detail-sublabel" style={{ marginTop: 4 }}>Analizando tu nicho y generando el guión</div>
                  </div>
                ) : adaptError ? (
                  <div className="info-banner-error">{adaptError}</div>
                ) : adaptation ? (
                  <div>
                    <div className="section-header-row" style={{ marginBottom: 12 }}>
                      <span style={{ fontSize: 13, fontWeight: 700 }}>Guión adaptado a tu nicho</span>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => navigator.clipboard.writeText(adaptation)} className="btn btn-ghost" style={{ fontSize: 12, padding: '5px 10px' }}>📋 Copiar</button>
                        <button onClick={() => generateAdaptation()} disabled={adapting} className="btn btn-primary" style={{ fontSize: 12, padding: '5px 10px' }}>🔄 Regenerar</button>
                      </div>
                    </div>
                    <div className="ai-result" style={{ maxHeight: 500, overflowY: 'auto' }}>{adaptation}</div>
                    <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Probar otro ángulo:</span>
                      {ANGLES.map(angle => (
                        <button key={angle} onClick={() => generateAdaptation(angle)} className="pill pill-inactive" style={{ fontSize: 11 }}>{angle}</button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="empty-state">
                    <div className="empty-state-icon">✨</div>
                    <p className="empty-state-title">Elegí un ángulo para generar tu adaptación</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 12 }}>
                      {ANGLES.map(angle => (
                        <button key={angle} onClick={() => generateAdaptation(angle)} className="btn btn-primary" style={{ fontSize: 13 }}>{angle}</button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
