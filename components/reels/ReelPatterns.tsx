'use client'

import { useState } from 'react'

type Patterns = {
  optimalDuration: number
  bestDays: { day: string; avgViews: number; avgMultiplier: number; count: number }[]
  bestHours: { hour: number; avgViews: number; avgMultiplier: number; count: number }[]
  avgSaveRate: number
  avgShareRate: number
  totalReels: number
  topReels: { caption?: string; views: number; multiplier: number; hook: string | null; duration_seconds: number | null; saves: number; shares: number }[]
  bottomReels: { caption?: string; views: number; multiplier: number; hook: string | null }[]
}

function formatDuration(s: number) {
  if (!s) return '—'
  const m = Math.floor(s / 60)
  const sec = s % 60
  return m > 0 ? `${m}:${String(sec).padStart(2, '0')}` : `${sec}s`
}

function formatHour(h: number) {
  if (h === 0) return '12 AM'
  if (h === 12) return '12 PM'
  return h < 12 ? `${h} AM` : `${h - 12} PM`
}

export default function ReelPatterns({ patterns }: { patterns: Patterns }) {
  const [aiAnalysis, setAiAnalysis] = useState('')
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(true)

  const generateDeepAnalysis = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/ai/generate-ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Analiza los PATRONES de mis reels de Instagram. Basándote en los datos reales, detectá patrones que pueda replicar.

DATOS:
- Total de reels: ${patterns.totalReels}
- Duración óptima: ${formatDuration(patterns.optimalDuration)}
- Mejores días (por rendimiento): ${patterns.bestDays.map(d => `${d.day} (${d.avgMultiplier}x, ${d.count} reels)`).join(', ')}
- Mejores horas (por rendimiento): ${patterns.bestHours.map(h => `${formatHour(h.hour)} (${h.avgMultiplier}x, ${h.count} reels)`).join(', ')}
- Save rate promedio: ${patterns.avgSaveRate}%
- Share rate promedio: ${patterns.avgShareRate}%

TOP REELS:
${patterns.topReels.map((r, i) => `${i + 1}. "${r.caption}" — ${r.views} views, ${r.multiplier?.toFixed(2)}x, hook: "${r.hook}", ${r.duration_seconds}s, saves: ${r.saves}, shares: ${r.shares}`).join('\n')}

PEORES REELS:
${patterns.bottomReels.map((r, i) => `${i + 1}. "${r.caption}" — ${r.views} views, ${r.multiplier?.toFixed(2)}x, hook: "${r.hook}"`).join('\n')}

Respondé con estas secciones:

**PATRÓN VIRAL DETECTADO**
¿Qué tienen en común tus mejores reels? (tema, formato, duración, tipo de hook)

**PATRÓN DE FRACASO**
¿Qué tienen en común tus peores reels? ¿Qué evitar?

**FÓRMULA GANADORA**
Tu fórmula ideal: duración + tipo de hook + tema + día/hora

**PRÓXIMOS 5 REELS**
5 ideas concretas que sigan tu patrón ganador, con el hook exacto.

Sé específico y basate solo en los datos reales.`,
        }),
      })
      const data = await res.json()
      if (data.result) setAiAnalysis(data.result)
    } catch { /* ignore */ } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card" style={{ padding: 20, marginBottom: 20 }}>
      <div className="collapse-header" onClick={() => setExpanded(!expanded)} style={{ marginBottom: expanded ? 16 : 0 }}>
        <div className="collapse-header-left">
          <span className="collapse-header-icon">🔍</span>
          <div>
            <div className="collapse-header-title">Patrón de Reels</div>
            <div className="collapse-header-desc">Patrones detectados en {patterns.totalReels} reels</div>
          </div>
        </div>
        <span className="collapse-toggle">{expanded ? '▲' : '▼'}</span>
      </div>

      {expanded && (
        <>
          <div className="info-banner info-banner-accent" style={{ marginBottom: 16 }}>
            <strong style={{ color: 'var(--accent)' }}>Basado en rendimiento, no frecuencia.</strong> Estos datos muestran en qué días y horas tus reels obtuvieron <strong style={{ color: 'var(--text)' }}>mejor multiplicador</strong> (más views vs tu promedio), no solo cuándo publicás más.
          </div>

          <div className="stat-tile-grid" style={{ marginBottom: 16 }}>
            <div className="stat-tile">
              <div className="stat-tile-label">DURACIÓN ÓPTIMA</div>
              <div className="stat-tile-value">{formatDuration(patterns.optimalDuration)}</div>
              <div className="stat-tile-sub">de tus top reels</div>
            </div>
            <div className="stat-tile">
              <div className="stat-tile-label">MEJOR DÍA PARA PUBLICAR</div>
              <div className="stat-tile-value" style={{ textTransform: 'capitalize' }}>{patterns.bestDays[0]?.day || '—'}</div>
              <div className="stat-tile-sub">{patterns.bestDays[0]?.avgMultiplier}x rendimiento · {patterns.bestDays[0]?.count} reels</div>
            </div>
            <div className="stat-tile">
              <div className="stat-tile-label">MEJOR HORA PARA PUBLICAR</div>
              <div className="stat-tile-value">{patterns.bestHours[0] ? formatHour(patterns.bestHours[0].hour) : '—'}</div>
              <div className="stat-tile-sub">{patterns.bestHours[0]?.avgMultiplier}x rendimiento · {patterns.bestHours[0]?.count} reels</div>
            </div>
            <div className="stat-tile">
              <div className="stat-tile-label">SAVE RATE</div>
              <div className="stat-tile-value" style={{ color: '#059669' }}>{patterns.avgSaveRate}%</div>
              <div className="stat-tile-sub">promedio general</div>
            </div>
            <div className="stat-tile">
              <div className="stat-tile-label">SHARE RATE</div>
              <div className="stat-tile-value" style={{ color: '#2563eb' }}>{patterns.avgShareRate}%</div>
              <div className="stat-tile-sub">promedio general</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div className="detail-panel">
              <div className="detail-label" style={{ marginBottom: 4 }}>DÍAS CON MEJOR RENDIMIENTO</div>
              <div className="detail-sublabel" style={{ marginBottom: 10 }}>Ordenados por multiplicador promedio</div>
              {patterns.bestDays.map((d, i) => (
                <div key={d.day} className="detail-row">
                  <span style={{ fontSize: 13, textTransform: 'capitalize' }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'} {d.day}</span>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: 12, fontWeight: 700 }}>{d.avgMultiplier}x</span>
                    <div className="stat-tile-sub">{d.count} reels · {d.avgViews.toLocaleString()} views prom.</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="detail-panel">
              <div className="detail-label" style={{ marginBottom: 4 }}>HORAS CON MEJOR RENDIMIENTO</div>
              <div className="detail-sublabel" style={{ marginBottom: 10 }}>Min. 2 reels por hora para aparecer</div>
              {patterns.bestHours.map((h, i) => (
                <div key={h.hour} className="detail-row">
                  <span style={{ fontSize: 13 }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'} {formatHour(h.hour)}</span>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: 12, fontWeight: 700 }}>{h.avgMultiplier}x</span>
                    <div className="stat-tile-sub">{h.count} reels · {h.avgViews.toLocaleString()} views prom.</div>
                  </div>
                </div>
              ))}
              {patterns.bestHours.length === 0 && (
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Necesitás publicar en más horarios distintos para detectar patrones</p>
              )}
            </div>
          </div>

          <button
            onClick={generateDeepAnalysis}
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', marginBottom: aiAnalysis ? 16 : 0 }}
          >
            {loading ? '⏳ Analizando patrones...' : aiAnalysis ? '🔄 Regenerar análisis IA' : '🤖 Análisis profundo con IA'}
          </button>

          {loading && (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🔍</div>
              <p style={{ fontSize: 13 }}>Detectando patrones en tus reels...</p>
            </div>
          )}

          {aiAnalysis && !loading && <div className="ai-result">{aiAnalysis}</div>}
        </>
      )}
    </div>
  )
}
