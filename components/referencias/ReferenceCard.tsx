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
    } catch (e: any) {
      setAdaptError(e.message || 'Error al adaptar')
    } finally {
      setAdapting(false)
    }
  }

  const structure = ref_.structure ? (typeof ref_.structure === 'string' ? JSON.parse(ref_.structure) : ref_.structure) : null

  const ANGLES = ['Mismo tema, mi nicho', 'Hook replicado', 'Estructura exacta', 'Tono contrario', 'Caso de cliente']

  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      {/* Header */}
      <div
        onClick={() => setExpanded(e => !e)}
        style={{ padding: '16px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14 }}
      >
        <div style={{ width: 44, height: 44, background: 'var(--accent-light)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
          🎬
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {adaptation && <span style={{ fontSize: 11, background: 'var(--success-bg)', color: 'var(--success)', padding: '3px 8px', borderRadius: 6, fontWeight: 600 }}>Adaptado ✓</span>}
          <button
            onClick={handleDelete}
            disabled={deleting}
            title="Borrar"
            style={{ background: 'none', border: 'none', cursor: deleting ? 'default' : 'pointer', fontSize: 15, color: 'var(--text-faint)', padding: 4, opacity: deleting ? 0.5 : 1 }}
          >
            {deleting ? '⏳' : '🗑'}
          </button>
          <span style={{ fontSize: 18, color: 'var(--text-muted)' }}>{expanded ? '↑' : '↓'}</span>
        </div>
      </div>

      {expanded && (
        <div style={{ borderTop: '1px solid var(--border)' }}>
          {/* Quick hook preview */}
          {ref_.hook && (
            <div style={{ padding: '12px 20px', background: 'var(--accent-light)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', background: 'white', padding: '2px 7px', borderRadius: 4, flexShrink: 0, marginTop: 1 }}>HOOK</span>
              <p style={{ fontSize: 13, color: 'var(--accent-dark)', lineHeight: 1.5, fontStyle: 'italic' }}>"{ref_.hook}"</p>
            </div>
          )}

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)' }}>
            {([['estructura', '📊 Estructura'], ['transcripcion', '📝 Transcripción'], ['adaptacion', '✨ Adaptación']] as [Tab, string][]).map(([t, l]) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  padding: '10px 18px', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                  background: tab === t ? 'var(--surface)' : 'var(--surface-2)',
                  color: tab === t ? 'var(--accent)' : 'var(--text-muted)',
                  borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent',
                  transition: 'all 0.12s',
                }}
              >
                {l}
              </button>
            ))}
          </div>

          <div style={{ padding: '18px 20px' }}>
            {/* ESTRUCTURA TAB */}
            {tab === 'estructura' && (
              <div>
                {structure ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    {/* Structure blocks */}
                    <div>
                      <h3 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: 12, textTransform: 'uppercase' }}>Estructura del video</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {(structure.blocks || []).map((block: any, i: number) => (
                          <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                            <div style={{ flexShrink: 0, width: 64, padding: '4px 0', textAlign: 'center' }}>
                              <div style={{ fontSize: 10, fontWeight: 700, color: 'white', background: ['#7c3aed', '#2563eb', '#d97706', '#059669', '#dc2626'][i % 5], padding: '3px 6px', borderRadius: 4 }}>
                                {block.label || `Bloque ${i + 1}`}
                              </div>
                              {block.duration && <div style={{ fontSize: 10, color: 'var(--text-faint)', marginTop: 2 }}>{block.duration}</div>}
                            </div>
                            <div style={{ flex: 1, background: 'var(--surface-2)', borderRadius: 8, padding: '8px 10px', fontSize: 12.5, lineHeight: 1.5 }}>
                              {block.content}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Angles & insights */}
                    <div>
                      <h3 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: 12, textTransform: 'uppercase' }}>Ángulos y técnicas</h3>
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
                            <span style={{ fontWeight: 600, color: 'var(--text)' }}>{x.value}</span>
                          </div>
                        ))}
                      </div>

                      {structure.key_insights && structure.key_insights.length > 0 && (
                        <div style={{ marginTop: 14 }}>
                          <h3 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: 8, textTransform: 'uppercase' }}>Insights clave</h3>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {structure.key_insights.map((insight: string, i: number) => (
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

                {/* Generate adaptation CTA */}
                <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Adaptá este video a tu contenido:</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                    {ANGLES.map(angle => (
                      <button
                        key={angle}
                        onClick={() => generateAdaptation(angle)}
                        disabled={adapting}
                        className="btn btn-ghost"
                        style={{ fontSize: 12, padding: '7px 12px' }}
                      >
                        {angle}
                      </button>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      value={customAngle}
                      onChange={e => setCustomAngle(e.target.value)}
                      placeholder="O escribí un ángulo personalizado..."
                      style={{ flex: 1, fontSize: 13 }}
                    />
                    <button onClick={() => generateAdaptation(customAngle)} disabled={adapting || !customAngle.trim()} className="btn btn-primary" style={{ fontSize: 13 }}>
                      {adapting ? '⏳' : '✨ Adaptar'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TRANSCRIPCIÓN TAB */}
            {tab === 'transcripcion' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>Transcripción completa</span>
                  {ref_.transcript && (
                    <button
                      onClick={() => navigator.clipboard.writeText(ref_.transcript || '')}
                      className="btn btn-ghost"
                      style={{ fontSize: 12, padding: '5px 10px' }}
                    >
                      📋 Copiar
                    </button>
                  )}
                </div>
                {ref_.transcript ? (
                  <div style={{ fontSize: 13.5, lineHeight: 1.8, color: 'var(--text)', background: 'var(--surface-2)', borderRadius: 10, padding: 16, maxHeight: 400, overflowY: 'auto', whiteSpace: 'pre-wrap' }}>
                    {ref_.transcript}
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: 13 }}>Sin transcripción disponible</p>
                )}
                {ref_.transcript && (
                  <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-muted)' }}>
                    {ref_.transcript.split(' ').length} palabras · {Math.ceil(ref_.transcript.split(' ').length / 150)} min de lectura
                  </div>
                )}
              </div>
            )}

            {/* ADAPTACIÓN TAB */}
            {tab === 'adaptacion' && (
              <div>
                {adapting ? (
                  <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: 32, marginBottom: 12 }}>✨</div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>Moka está adaptando el contenido...</div>
                    <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 4 }}>Analizando tu nicho y generando el guión</div>
                  </div>
                ) : adaptError ? (
                  <div style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger)', borderRadius: 10, padding: 16, fontSize: 13, color: 'var(--danger)' }}>
                    {adaptError}
                  </div>
                ) : adaptation ? (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <span style={{ fontSize: 13, fontWeight: 700 }}>Guión adaptado a tu nicho</span>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => navigator.clipboard.writeText(adaptation)} className="btn btn-ghost" style={{ fontSize: 12, padding: '5px 10px' }}>📋 Copiar</button>
                        <button onClick={() => generateAdaptation()} disabled={adapting} className="btn btn-primary" style={{ fontSize: 12, padding: '5px 10px' }}>🔄 Regenerar</button>
                      </div>
                    </div>
                    <div style={{ fontSize: 13.5, lineHeight: 1.9, color: 'var(--text)', background: 'var(--surface-2)', borderRadius: 10, padding: 18, whiteSpace: 'pre-wrap', maxHeight: 500, overflowY: 'auto' }}>
                      {adaptation}
                    </div>
                    <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Probar otro ángulo:</span>
                      {ANGLES.map(angle => (
                        <button key={angle} onClick={() => generateAdaptation(angle)} className="pill pill-inactive" style={{ fontSize: 11 }}>{angle}</button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '32px 0' }}>
                    <div style={{ fontSize: 36, marginBottom: 12 }}>✨</div>
                    <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 16 }}>Elegí un ángulo para generar tu adaptación</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
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
