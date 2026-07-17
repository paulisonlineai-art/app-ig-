'use client'
import { useState } from 'react'
import type { ContentPiece } from '@/types'

type Stage = { id: string; label: string; color: string }

const FORMATS = [
  { id: 'talking_head', label: 'Talking Head', desc: 'Tú hablando a cámara' },
  { id: 'voiceover', label: 'Voiceover', desc: 'Voz sobre imágenes/b-roll' },
  { id: 'text_screen', label: 'Texto en pantalla', desc: 'Texto animado sin voz' },
  { id: 'tutorial', label: 'Tutorial', desc: 'Paso a paso mostrando pantalla' },
  { id: 'storytelling', label: 'Storytelling', desc: 'Narrativa personal' },
]

const OBJECTIVES = [
  { id: 'educate', label: 'Educar', emoji: '📚' },
  { id: 'entertain', label: 'Entretener', emoji: '🎭' },
  { id: 'sell', label: 'Vender', emoji: '💰' },
  { id: 'authority', label: 'Autoridad', emoji: '👑' },
  { id: 'community', label: 'Comunidad', emoji: '🤝' },
]

const INTENSITIES = [
  { id: 'casual', label: 'Casual', desc: 'Relajado, conversacional' },
  { id: 'medium', label: 'Medio', desc: 'Energético pero natural' },
  { id: 'intense', label: 'Intenso', desc: 'Alto impacto, urgente' },
]

function ScriptGenerator({ piece, onClose }: { piece: ContentPiece; onClose: () => void }) {
  const [format, setFormat] = useState('talking_head')
  const [objective, setObjective] = useState('educate')
  const [intensity, setIntensity] = useState('medium')
  const [script, setScript] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const generate = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/ai/generate-ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Generá un guión completo para un reel de Instagram basado en esta pieza de contenido.

TÍTULO DE LA PIEZA: "${piece.title}"
TIPO: ${piece.content_type}
FORMATO: ${FORMATS.find(f => f.id === format)?.label} — ${FORMATS.find(f => f.id === format)?.desc}
OBJETIVO: ${OBJECTIVES.find(o => o.id === objective)?.label}
INTENSIDAD: ${INTENSITIES.find(i => i.id === intensity)?.label} — ${INTENSITIES.find(i => i.id === intensity)?.desc}

Estructura el guión así:

🎣 HOOK (primeros 2-3 segundos):
[El gancho exacto para captar atención]

📝 GUIÓN COMPLETO:
[Guión palabra por palabra, con indicaciones de tono entre corchetes]
[Incluí pausas, énfasis y cambios de ritmo]

🎬 INDICACIONES VISUALES:
[Qué se ve en pantalla en cada momento]

📱 CTA FINAL:
[Call to action específico]

⏱ DURACIÓN ESTIMADA: [X segundos]

💡 TIPS DE GRABACIÓN:
[2-3 tips específicos para este formato]

El guión debe sonar natural, no como un robot. Adaptá el tono a la intensidad elegida.`,
        }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setError(data.error || 'Error generando guión')
        return
      }
      setScript(data.result || '')
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const pillStyle = (selected: boolean) => ({
    padding: '6px 14px',
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600 as const,
    border: selected ? '2px solid var(--accent)' : '1px solid var(--border)',
    background: selected ? 'var(--accent-light)' : 'var(--surface-2)',
    color: selected ? 'var(--accent)' : 'var(--text-muted)',
    cursor: 'pointer' as const,
  })

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, width: '100%', maxWidth: 600, maxHeight: '90vh', overflow: 'auto', padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800 }}>Generador de guiones</h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{piece.title}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, color: 'var(--text-muted)', cursor: 'pointer' }}>✕</button>
        </div>

        {/* Format */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, display: 'block', letterSpacing: '0.05em' }}>FORMATO</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {FORMATS.map(f => (
              <button key={f.id} onClick={() => setFormat(f.id)} style={pillStyle(format === f.id)}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Objective */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, display: 'block', letterSpacing: '0.05em' }}>OBJETIVO</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {OBJECTIVES.map(o => (
              <button key={o.id} onClick={() => setObjective(o.id)} style={pillStyle(objective === o.id)}>
                {o.emoji} {o.label}
              </button>
            ))}
          </div>
        </div>

        {/* Intensity */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, display: 'block', letterSpacing: '0.05em' }}>INTENSIDAD</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {INTENSITIES.map(i => (
              <button key={i.id} onClick={() => setIntensity(i.id)} style={pillStyle(intensity === i.id)}>
                {i.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={generate}
          disabled={loading}
          style={{ width: '100%', background: 'var(--accent)', color: 'white', border: 'none', padding: '12px', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: loading ? 'wait' : 'pointer', marginBottom: 16 }}
        >
          {loading ? '⏳ Generando guión...' : script ? '🔄 Regenerar guión' : '✨ Generar guión'}
        </button>

        {error && (
          <div style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--danger)', marginBottom: 16 }}>
            {error}
          </div>
        )}

        {loading && (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>✍️</div>
            <p style={{ fontSize: 13, fontWeight: 600 }}>Escribiendo tu guión...</p>
          </div>
        )}

        {script && !loading && (
          <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 13.5, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
              {script}
            </div>
            <button
              onClick={() => navigator.clipboard.writeText(script)}
              style={{ marginTop: 12, background: 'var(--surface-3)', border: '1px solid var(--border)', color: 'var(--text)', padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
            >
              📋 Copiar guión
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ContentPipeline({ pieces, stages, accountId }: { pieces: ContentPiece[]; stages: Stage[]; accountId: string }) {
  const [items, setItems] = useState(pieces)
  const [showForm, setShowForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newType, setNewType] = useState('reel')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [scriptPiece, setScriptPiece] = useState<ContentPiece | null>(null)

  const byStage = (stageId: string) => items.filter(p => p.status === stageId)

  const moveStage = async (pieceId: string, newStatus: string) => {
    const prevStatus = items.find(p => p.id === pieceId)?.status
    setError('')
    setItems(prev => prev.map(p => p.id === pieceId ? { ...p, status: newStatus as any } : p))
    try {
      const res = await fetch('/api/content/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: pieceId, status: newStatus }),
      })
      if (!res.ok) throw new Error('No se pudo mover la pieza')
    } catch (e: any) {
      setItems(prev => prev.map(p => p.id === pieceId ? { ...p, status: prevStatus as any } : p))
      setError(e.message || 'No se pudo mover la pieza')
    }
  }

  const addPiece = async () => {
    if (!newTitle.trim()) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/content/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle, content_type: newType, status: 'idea' }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setError(data.error || 'No se pudo agregar la pieza')
        return
      }
      if (data.piece) {
        setItems(prev => [...prev, data.piece])
        setNewTitle('')
        setShowForm(false)
      }
    } catch {
      setError('Error de conexión — intentá de nuevo')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      {error && (
        <div style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--danger)', marginBottom: 16 }}>
          {error}
        </div>
      )}
      <div style={{ marginBottom: 16 }}>
        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            style={{ background: 'var(--accent)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
          >
            + Nueva pieza
          </button>
        ) : (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input
              autoFocus
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addPiece()}
              placeholder="Título de la pieza..."
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', color: 'var(--text)', fontSize: 14, outline: 'none', width: 280 }}
            />
            <select value={newType} onChange={e => setNewType(e.target.value)} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', color: 'var(--text)', fontSize: 14 }}>
              <option value="reel">Reel</option>
              <option value="trial_reel">Trial Reel</option>
              <option value="story">Historia</option>
              <option value="post">Post</option>
            </select>
            <button onClick={addPiece} disabled={saving} style={{ background: 'var(--accent)', color: 'white', border: 'none', padding: '10px 16px', borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
              {saving ? '...' : 'Guardar'}
            </button>
            <button onClick={() => setShowForm(false)} style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--text-muted)', padding: '10px 14px', borderRadius: 10, fontSize: 14, cursor: 'pointer' }}>
              Cancelar
            </button>
          </div>
        )}
      </div>

      {/* Kanban board */}
      <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 16 }}>
        {stages.map(stage => (
          <div key={stage.id} style={{ minWidth: 240, flex: '0 0 240px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: stage.color }} />
              <span style={{ fontSize: 13, fontWeight: 600 }}>{stage.label}</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 'auto' }}>{byStage(stage.id).length}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {byStage(stage.id).map(piece => (
                <div
                  key={piece.id}
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 14 }}
                >
                  <div style={{ fontSize: 12, color: stage.color, fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {piece.content_type}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, lineHeight: 1.4 }}>
                    {piece.title}
                  </div>
                  {piece.target_publish_date && (
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>
                      📅 {new Date(piece.target_publish_date).toLocaleDateString('es')}
                    </div>
                  )}

                  {/* Script generator button */}
                  <button
                    onClick={() => setScriptPiece(piece)}
                    style={{ width: '100%', background: 'var(--accent-light)', border: '1px solid transparent', color: 'var(--accent)', padding: '6px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', marginBottom: 8 }}
                  >
                    ✨ Generar guión
                  </button>

                  {/* Stage navigation */}
                  <div style={{ display: 'flex', gap: 6 }}>
                    {stages.findIndex(s => s.id === piece.status) > 0 && (
                      <button
                        onClick={() => moveStage(piece.id, stages[stages.findIndex(s => s.id === piece.status) - 1].id)}
                        style={{ flex: 1, background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-muted)', padding: '6px', borderRadius: 6, fontSize: 11, cursor: 'pointer' }}
                      >
                        ← Atrás
                      </button>
                    )}
                    {stages.findIndex(s => s.id === piece.status) < stages.length - 1 && (
                      <button
                        onClick={() => moveStage(piece.id, stages[stages.findIndex(s => s.id === piece.status) + 1].id)}
                        style={{ flex: 1, background: stage.color, border: 'none', color: 'white', padding: '6px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
                      >
                        Avanzar →
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Script generator modal */}
      {scriptPiece && (
        <ScriptGenerator piece={scriptPiece} onClose={() => setScriptPiece(null)} />
      )}
    </div>
  )
}
