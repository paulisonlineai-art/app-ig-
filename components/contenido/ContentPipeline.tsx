'use client'
import { useState } from 'react'
import type { ContentPiece } from '@/types'

type Stage = { id: string; label: string; color: string }

export default function ContentPipeline({ pieces, stages, accountId }: { pieces: ContentPiece[]; stages: Stage[]; accountId: string }) {
  const [items, setItems] = useState(pieces)
  const [showForm, setShowForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newType, setNewType] = useState('reel')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

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
      // Revert the optimistic move — the card can't silently stay somewhere
      // the database doesn't actually have it.
      setItems(prev => prev.map(p => p.id === pieceId ? { ...p, status: prevStatus as any } : p))
      setError(e.message || 'No se pudo mover la pieza')
    }
  }

  const addPiece = async () => {
    if (!newTitle.trim()) return
    setSaving(true)
    const res = await fetch('/api/content/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle, content_type: newType, status: 'idea' }),
    })
    const data = await res.json()
    if (data.piece) {
      setItems(prev => [...prev, data.piece])
      setNewTitle('')
      setShowForm(false)
    }
    setSaving(false)
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
    </div>
  )
}
