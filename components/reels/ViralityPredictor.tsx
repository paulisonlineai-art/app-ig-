'use client'

import { useState } from 'react'

type Prediction = {
  score: number
  predicted_multiplier: string
  confidence: string
  strengths: string[]
  risks: string[]
  similar_to: string
  suggestions: string[]
  verdict: string
}

function ScoreRing({ score }: { score: number }) {
  const r = 54, c = 2 * Math.PI * r
  const color = score >= 75 ? '#059669' : score >= 50 ? '#d97706' : score >= 30 ? '#ea580c' : '#dc2626'
  return (
    <svg width="130" height="130" viewBox="0 0 130 130">
      <circle cx="65" cy="65" r={r} fill="none" stroke="var(--surface-2)" strokeWidth="10" />
      <circle cx="65" cy="65" r={r} fill="none" stroke={color} strokeWidth="10"
        strokeDasharray={`${(score / 100) * c} ${c}`}
        strokeLinecap="round" transform="rotate(-90 65 65)"
        style={{ transition: 'stroke-dasharray 0.8s ease' }} />
      <text x="65" y="60" textAnchor="middle" fontSize="32" fontWeight="800" fill="var(--text)">{score}</text>
      <text x="65" y="78" textAnchor="middle" fontSize="11" fill="var(--text-muted)">/ 100</text>
    </svg>
  )
}

export default function ViralityPredictor() {
  const [hook, setHook] = useState('')
  const [caption, setCaption] = useState('')
  const [duration, setDuration] = useState('')
  const [format, setFormat] = useState('')
  const [prediction, setPrediction] = useState<Prediction | null>(null)
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(true)

  const predict = async () => {
    if (!hook.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/ai/predict-virality', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hook, caption, duration: duration ? +duration : null, format: format || null }),
      })
      const data = await res.json()
      if (data.prediction) setPrediction(data.prediction)
    } catch { /* ignore */ } finally {
      setLoading(false)
    }
  }

  const FORMATS = [
    { value: 'talking_head', label: 'Cámara' },
    { value: 'voiceover', label: 'Voiceover' },
    { value: 'text_screen', label: 'Texto' },
    { value: 'tutorial', label: 'Tutorial' },
    { value: 'storytelling', label: 'Historia' },
  ]

  return (
    <div className="card" style={{ padding: 20, marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: expanded ? 16 : 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>🎯</span>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 800 }}>Predictor de Viralidad</h2>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Predecí si tu próximo reel va a funcionar antes de grabarlo</p>
          </div>
        </div>
        <button onClick={() => setExpanded(!expanded)} style={{ background: 'none', border: 'none', fontSize: 16, color: 'var(--text-muted)', cursor: 'pointer' }}>
          {expanded ? '▲' : '▼'}
        </button>
      </div>

      {expanded && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>HOOK (primeras palabras) *</label>
              <input
                value={hook}
                onChange={e => setHook(e.target.value)}
                placeholder="Ej: 'Esto es lo que nadie te dice sobre...'"
                style={{ width: '100%', padding: '10px 14px', fontSize: 13, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text)' }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>TEMA / CAPTION (opcional)</label>
              <input
                value={caption}
                onChange={e => setCaption(e.target.value)}
                placeholder="¿De qué va a hablar el reel?"
                style={{ width: '100%', padding: '10px 14px', fontSize: 13, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text)' }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>DURACIÓN (seg)</label>
                <input
                  value={duration}
                  onChange={e => setDuration(e.target.value)}
                  type="number"
                  placeholder="30"
                  style={{ width: '100%', padding: '10px 14px', fontSize: 13, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text)' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>FORMATO</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {FORMATS.map(f => (
                    <button
                      key={f.value}
                      onClick={() => setFormat(format === f.value ? '' : f.value)}
                      style={{
                        padding: '6px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                        background: format === f.value ? 'var(--accent)' : 'var(--surface-2)',
                        color: format === f.value ? 'white' : 'var(--text-muted)',
                        border: format === f.value ? 'none' : '1px solid var(--border)',
                      }}
                    >{f.label}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={predict}
            disabled={loading || !hook.trim()}
            className="btn btn-primary"
            style={{ width: '100%', marginBottom: prediction ? 16 : 0 }}
          >
            {loading ? '⏳ Analizando contra tus patrones...' : '🎯 Predecir viralidad'}
          </button>

          {prediction && !loading && (
            <div style={{ marginTop: 4 }}>
              <div style={{ display: 'flex', gap: 20, alignItems: 'center', marginBottom: 16 }}>
                <ScoreRing score={prediction.score} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 4 }}>{prediction.verdict}</div>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
                    <span style={{ fontSize: 12, background: 'var(--surface-2)', padding: '4px 10px', borderRadius: 6, fontWeight: 600 }}>
                      Multiplicador estimado: {prediction.predicted_multiplier}
                    </span>
                    <span style={{ fontSize: 12, background: 'var(--surface-2)', padding: '4px 10px', borderRadius: 6, fontWeight: 600 }}>
                      Confianza: {prediction.confidence}
                    </span>
                  </div>
                  {prediction.similar_to && (
                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Similar a: "{prediction.similar_to}"</p>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div style={{ background: 'rgba(5,150,105,0.08)', border: '1px solid rgba(5,150,105,0.2)', borderRadius: 10, padding: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#059669', marginBottom: 8 }}>FORTALEZAS</div>
                  {prediction.strengths.map((s, i) => (
                    <div key={i} style={{ fontSize: 12, marginBottom: 4, color: 'var(--text)' }}>✓ {s}</div>
                  ))}
                </div>
                <div style={{ background: 'rgba(234,88,12,0.08)', border: '1px solid rgba(234,88,12,0.2)', borderRadius: 10, padding: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#ea580c', marginBottom: 8 }}>RIESGOS</div>
                  {prediction.risks.map((r, i) => (
                    <div key={i} style={{ fontSize: 12, marginBottom: 4, color: 'var(--text)' }}>⚠ {r}</div>
                  ))}
                </div>
              </div>

              {prediction.suggestions.length > 0 && (
                <div style={{ background: 'var(--accent-light)', border: '1px solid rgba(247,0,124,0.15)', borderRadius: 10, padding: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', marginBottom: 8 }}>MEJORAS SUGERIDAS</div>
                  {prediction.suggestions.map((s, i) => (
                    <div key={i} style={{ fontSize: 12, marginBottom: 4, color: 'var(--text)' }}>→ {s}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
