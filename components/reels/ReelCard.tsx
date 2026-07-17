'use client'
import { formatNumber } from '@/lib/utils'
import type { Reel } from '@/types'
import { useState } from 'react'

export default function ReelCard({ reel }: { reel: Reel }) {
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState(reel.ai_analysis || '')
  const [expanded, setExpanded] = useState(false)

  const [analyzeError, setAnalyzeError] = useState('')

  const analyze = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setAnalyzing(true)
    setAnalyzeError('')
    try {
      const res = await fetch('/api/ai/analyze-reel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reelId: reel.id }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setAnalyzeError(data.error || 'Error al analizar')
        return
      }
      setAnalysis(data.analysis)
      setExpanded(true)
    } catch {
      setAnalyzeError('Error de conexión — intentá de nuevo')
    } finally {
      setAnalyzing(false)
    }
  }

  const multiplierColor = reel.multiplier >= 2 ? 'var(--success)' : reel.multiplier >= 1 ? 'var(--warning)' : 'var(--danger)'

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 16,
      overflow: 'hidden',
      cursor: 'pointer',
    }}>
      {/* Thumbnail */}
      <div style={{ position: 'relative', aspectRatio: '9/16', maxHeight: 200, background: 'var(--surface-2)', overflow: 'hidden' }}>
        {reel.thumbnail_url && (
          <img src={`/api/proxy-image?url=${encodeURIComponent(reel.thumbnail_url)}`} alt={reel.caption?.split('\n')[0]?.slice(0, 80) || 'Reel'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        )}
        <div style={{
          position: 'absolute',
          top: 8, right: 8,
          background: multiplierColor,
          color: 'white',
          borderRadius: 8,
          padding: '4px 8px',
          fontSize: 12,
          fontWeight: 700,
        }}>
          {reel.multiplier.toFixed(1)}x
        </div>
        {reel.is_trial && (
          <div style={{
            position: 'absolute',
            top: 8, left: 8,
            background: 'rgba(0,0,0,0.7)',
            color: 'white',
            borderRadius: 6,
            padding: '3px 7px',
            fontSize: 11,
            fontWeight: 600,
          }}>
            Trial
          </div>
        )}
      </div>

      <div style={{ padding: 16 }}>
        {/* Caption */}
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.4 }}>
          {reel.caption?.slice(0, 80) || 'Sin descripción'}
          {(reel.caption?.length || 0) > 80 ? '...' : ''}
        </p>

        {/* Metrics grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
          {[
            { label: 'Views', value: formatNumber(reel.views) },
            { label: 'Likes', value: `${reel.like_rate.toFixed(1)}%` },
            { label: 'Comentarios', value: `${reel.comment_rate.toFixed(1)}%` },
          ].map(m => (
            <div key={m.label} style={{ background: 'var(--surface-2)', borderRadius: 8, padding: '8px 10px' }}>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{m.value}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{m.label}</div>
            </div>
          ))}
        </div>

        {/* WPM */}
        {reel.words_per_minute && (
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
            🗣 {reel.words_per_minute} palabras/min
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={analyze}
            disabled={analyzing}
            style={{
              flex: 1,
              background: analyzing ? 'var(--border)' : 'var(--accent)',
              color: 'white',
              border: 'none',
              padding: '8px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              cursor: analyzing ? 'not-allowed' : 'pointer',
            }}
          >
            {analyzing ? '⏳ Analizando...' : analysis ? '🤖 Re-analizar' : '🤖 Analizar con IA'}
          </button>
          <a
            href={reel.permalink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--surface-2)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              padding: '8px 12px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            IG ↗
          </a>
        </div>

        {analyzeError && (
          <div style={{ marginTop: 8, fontSize: 12, color: 'var(--danger)' }}>{analyzeError}</div>
        )}

        {/* AI Analysis */}
        {analysis && expanded && (
          <div style={{
            marginTop: 12,
            padding: 12,
            background: 'var(--surface-2)',
            borderRadius: 10,
            border: '1px solid var(--border)',
            fontSize: 13,
            lineHeight: 1.6,
            color: 'var(--text-muted)',
            whiteSpace: 'pre-wrap',
          }}>
            {analysis}
          </div>
        )}
        {analysis && !expanded && (
          <button
            onClick={() => setExpanded(true)}
            style={{ marginTop: 8, background: 'none', border: 'none', color: 'var(--accent-light)', fontSize: 12, cursor: 'pointer', padding: 0 }}
          >
            Ver análisis ↓
          </button>
        )}
      </div>
    </div>
  )
}
