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
      <div className="collapse-header" onClick={() => setExpanded(!expanded)} style={{ marginBottom: expanded ? 16 : 0 }}>
        <div className="collapse-header-left">
          <span className="collapse-header-icon">🎯</span>
          <div>
            <div className="collapse-header-title">Predictor de Viralidad</div>
            <div className="collapse-header-desc">Predecí si tu próximo reel va a funcionar antes de grabarlo</div>
          </div>
        </div>
        <span className="collapse-toggle">{expanded ? '▲' : '▼'}</span>
      </div>

      {expanded && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
            <div>
              <label className="form-label">HOOK (primeras palabras) *</label>
              <input
                value={hook}
                onChange={e => setHook(e.target.value)}
                placeholder="Ej: 'Esto es lo que nadie te dice sobre...'"
              />
            </div>
            <div>
              <label className="form-label">TEMA / CAPTION (opcional)</label>
              <input
                value={caption}
                onChange={e => setCaption(e.target.value)}
                placeholder="¿De qué va a hablar el reel?"
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="form-label">DURACIÓN (seg)</label>
                <input
                  value={duration}
                  onChange={e => setDuration(e.target.value)}
                  type="number"
                  placeholder="30"
                />
              </div>
              <div>
                <label className="form-label">FORMATO</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {FORMATS.map(f => (
                    <button
                      key={f.value}
                      onClick={() => setFormat(format === f.value ? '' : f.value)}
                      className={`pill-option ${format === f.value ? 'pill-option-active' : 'pill-option-inactive'}`}
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
                    <span className="pred-meta">Multiplicador estimado: {prediction.predicted_multiplier}</span>
                    <span className="pred-meta">Confianza: {prediction.confidence}</span>
                  </div>
                  {prediction.similar_to && (
                    <p className="detail-sublabel">Similar a: &quot;{prediction.similar_to}&quot;</p>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div className="pred-panel pred-panel-success">
                  <div className="pred-panel-label" style={{ color: '#059669' }}>FORTALEZAS</div>
                  {prediction.strengths.map((s, i) => (
                    <div key={i} className="pred-panel-item">✓ {s}</div>
                  ))}
                </div>
                <div className="pred-panel pred-panel-warning">
                  <div className="pred-panel-label" style={{ color: '#ea580c' }}>RIESGOS</div>
                  {prediction.risks.map((r, i) => (
                    <div key={i} className="pred-panel-item">⚠ {r}</div>
                  ))}
                </div>
              </div>

              {prediction.suggestions.length > 0 && (
                <div className="pred-panel pred-panel-accent">
                  <div className="pred-panel-label" style={{ color: 'var(--accent)' }}>MEJORAS SUGERIDAS</div>
                  {prediction.suggestions.map((s, i) => (
                    <div key={i} className="pred-panel-item">→ {s}</div>
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
