'use client'

import { useState } from 'react'

export default function CommentInsights() {
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [meta, setMeta] = useState<{ commentCount: number; reelCount: number } | null>(null)

  const analyze = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/ai/comment-ideas', { method: 'POST' })
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

  return (
    <div className="card" style={{ padding: 20, marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <span style={{ fontSize: 20 }}>💬</span>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 800 }}>Ideas desde Comentarios</h2>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Analizamos los comentarios reales de tu audiencia para sacar ideas de contenido
          </p>
        </div>
      </div>

      <div style={{ background: 'var(--accent-light)', border: '1px solid rgba(247,0,124,0.15)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
        <strong style={{ color: 'var(--accent)' }}>¿Cómo funciona?</strong> Klar lee los comentarios de tus 5 reels más comentados, detecta patrones (preguntas, objeciones, temas recurrentes) y genera ideas de contenido basadas en lo que tu audiencia realmente pide.
      </div>

      <button
        onClick={analyze}
        disabled={loading}
        className="btn btn-primary"
        style={{ width: '100%', marginBottom: result || error ? 16 : 0 }}
      >
        {loading ? '⏳ Scrapeando comentarios y analizando...' : result ? '🔄 Volver a analizar' : '💬 Analizar comentarios de mi audiencia'}
      </button>

      {loading && (
        <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>💬</div>
          <p style={{ fontSize: 13 }}>Leyendo comentarios de tus reels más populares...</p>
          <p style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 4 }}>Esto puede tomar hasta 2 minutos</p>
        </div>
      )}

      {error && (
        <div style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--danger)' }}>
          {error}
        </div>
      )}

      {result && !loading && (
        <>
          {meta && (
            <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
              <div style={{ background: 'var(--surface-2)', borderRadius: 8, padding: '8px 14px', fontSize: 12 }}>
                <span style={{ fontWeight: 700 }}>{meta.commentCount}</span>
                <span style={{ color: 'var(--text-muted)' }}> comentarios analizados</span>
              </div>
              <div style={{ background: 'var(--surface-2)', borderRadius: 8, padding: '8px 14px', fontSize: 12 }}>
                <span style={{ fontWeight: 700 }}>{meta.reelCount}</span>
                <span style={{ color: 'var(--text-muted)' }}> reels escaneados</span>
              </div>
            </div>
          )}
          <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, fontSize: 13.5, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
            {result}
          </div>
        </>
      )}
    </div>
  )
}
