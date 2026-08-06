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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-body" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800 }}>Generador de guiones</h2>
            <p className="dash-subtitle" style={{ marginTop: 2 }}>{piece.title}</p>
          </div>
          <button onClick={onClose} className="modal-close">✕</button>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label className="form-label" style={{ letterSpacing: '0.05em', fontWeight: 700, marginBottom: 8 }}>FORMATO</label>
          <div className="pill-select">
            {FORMATS.map(f => (
              <button key={f.id} onClick={() => setFormat(f.id)} className={`pill-option ${format === f.id ? 'pill-option-active' : 'pill-option-inactive'}`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label className="form-label" style={{ letterSpacing: '0.05em', fontWeight: 700, marginBottom: 8 }}>OBJETIVO</label>
          <div className="pill-select">
            {OBJECTIVES.map(o => (
              <button key={o.id} onClick={() => setObjective(o.id)} className={`pill-option ${objective === o.id ? 'pill-option-active' : 'pill-option-inactive'}`}>
                {o.emoji} {o.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label className="form-label" style={{ letterSpacing: '0.05em', fontWeight: 700, marginBottom: 8 }}>INTENSIDAD</label>
          <div className="pill-select">
            {INTENSITIES.map(i => (
              <button key={i.id} onClick={() => setIntensity(i.id)} className={`pill-option ${intensity === i.id ? 'pill-option-active' : 'pill-option-inactive'}`}>
                {i.label}
              </button>
            ))}
          </div>
        </div>

        <button onClick={generate} disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: 12, fontSize: 14, marginBottom: 16 }}>
          {loading ? '⏳ Generando guión...' : script ? '🔄 Regenerar guión' : '✨ Generar guión'}
        </button>

        {error && <div className="info-banner-error" style={{ marginBottom: 16 }}>{error}</div>}

        {loading && (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>✍️</div>
            <p style={{ fontSize: 13, fontWeight: 600 }}>Escribiendo tu guión...</p>
          </div>
        )}

        {script && !loading && (
          <div className="ai-result">
            {script}
            <button
              onClick={() => navigator.clipboard.writeText(script)}
              className="btn btn-ghost"
              style={{ marginTop: 12 }}
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
    setItems(prev => prev.map(p => p.id === pieceId ? { ...p, status: newStatus as ContentPiece['status'] } : p))
    try {
      const res = await fetch('/api/content/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: pieceId, status: newStatus }),
      })
      if (!res.ok) throw new Error('No se pudo mover la pieza')
    } catch (e: unknown) {
      setItems(prev => prev.map(p => p.id === pieceId ? { ...p, status: prevStatus as ContentPiece['status'] } : p))
      setError(e instanceof Error ? e.message : 'No se pudo mover la pieza')
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
      {error && <div className="info-banner-error" style={{ marginBottom: 16 }}>{error}</div>}

      <div style={{ marginBottom: 16 }}>
        {!showForm ? (
          <button onClick={() => setShowForm(true)} className="btn btn-primary" style={{ fontSize: 14 }}>
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
              style={{ width: 280, fontSize: 14 }}
            />
            <select value={newType} onChange={e => setNewType(e.target.value)} style={{ fontSize: 14 }}>
              <option value="reel">Reel</option>
              <option value="trial_reel">Trial Reel</option>
              <option value="story">Historia</option>
              <option value="post">Post</option>
            </select>
            <button onClick={addPiece} disabled={saving} className="btn btn-primary" style={{ fontSize: 14 }}>
              {saving ? '...' : 'Guardar'}
            </button>
            <button onClick={() => setShowForm(false)} className="btn btn-ghost" style={{ fontSize: 14 }}>
              Cancelar
            </button>
          </div>
        )}
      </div>

      <div className="kanban-board">
        {stages.map(stage => (
          <div key={stage.id} className="kanban-column">
            <div className="kanban-column-header">
              <div className="kanban-column-dot" style={{ background: stage.color }} />
              <span className="kanban-column-label">{stage.label}</span>
              <span className="kanban-column-count">{byStage(stage.id).length}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {byStage(stage.id).map(piece => (
                <div key={piece.id} className="kanban-card">
                  <div className="kanban-card-type" style={{ color: stage.color }}>
                    {piece.content_type}
                  </div>
                  <div className="kanban-card-title">{piece.title}</div>
                  {piece.target_publish_date && (
                    <div className="kanban-card-date">
                      📅 {new Date(piece.target_publish_date).toLocaleDateString('es')}
                    </div>
                  )}

                  <button
                    onClick={() => setScriptPiece(piece)}
                    style={{ width: '100%', background: 'var(--accent-light)', border: '1px solid transparent', color: 'var(--accent)', padding: 6, borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', marginBottom: 8 }}
                  >
                    ✨ Generar guión
                  </button>

                  <div className="kanban-card-actions">
                    {stages.findIndex(s => s.id === piece.status) > 0 && (
                      <button
                        onClick={() => moveStage(piece.id, stages[stages.findIndex(s => s.id === piece.status) - 1].id)}
                        className="btn btn-ghost" style={{ flex: 1, padding: 6, fontSize: 11 }}
                      >
                        ← Atrás
                      </button>
                    )}
                    {stages.findIndex(s => s.id === piece.status) < stages.length - 1 && (
                      <button
                        onClick={() => moveStage(piece.id, stages[stages.findIndex(s => s.id === piece.status) + 1].id)}
                        style={{ flex: 1, background: stage.color, border: 'none', color: 'white', padding: 6, borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
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

      {scriptPiece && <ScriptGenerator piece={scriptPiece} onClose={() => setScriptPiece(null)} />}
    </div>
  )
}
