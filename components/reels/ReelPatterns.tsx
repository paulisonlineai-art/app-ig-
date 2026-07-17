'use client'

import { useState } from 'react'

type Patterns = {
  optimalDuration: number
  bestDays: { day: string; avgViews: number; avgMultiplier: number; count: number }[]
  bestHours: { hour: number; avgViews: number; avgMultiplier: number; count: number }[]
  avgSaveRate: number
  avgShareRate: number
  totalReels: number
  topReels: any[]
  bottomReels: any[]
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
- Mejores días: ${patterns.bestDays.map(d => `${d.day} (${d.avgMultiplier}x, ${d.count} reels)`).join(', ')}
- Mejores horas: ${patterns.bestHours.map(h => `${formatHour(h.hour)} (${h.avgMultiplier}x, ${h.count} reels)`).join(', ')}
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: expanded ? 16 : 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>🔍</span>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 800 }}>Patrón de Reels</h2>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Patrones detectados en {patterns.totalReels} reels</p>
          </div>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          style={{ background: 'none', border: 'none', fontSize: 16, color: 'var(--text-muted)', cursor: 'pointer' }}
        >
          {expanded ? '▲' : '▼'}
        </button>
      </div>

      {expanded && (
        <>
          {/* Quick stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 16 }}>
            <div style={{ background: 'var(--surface-2)', borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em', marginBottom: 4 }}>DURACIÓN ÓPTIMA</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--accent)' }}>{formatDuration(patterns.optimalDuration)}</div>
            </div>
            <div style={{ background: 'var(--surface-2)', borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em', marginBottom: 4 }}>MEJOR DÍA</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--accent)', textTransform: 'capitalize' }}>{patterns.bestDays[0]?.day || '—'}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{patterns.bestDays[0]?.avgMultiplier}x promedio</div>
            </div>
            <div style={{ background: 'var(--surface-2)', borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em', marginBottom: 4 }}>MEJOR HORA</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--accent)' }}>{patterns.bestHours[0] ? formatHour(patterns.bestHours[0].hour) : '—'}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{patterns.bestHours[0]?.avgMultiplier}x promedio</div>
            </div>
            <div style={{ background: 'var(--surface-2)', borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em', marginBottom: 4 }}>SAVE RATE</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#059669' }}>{patterns.avgSaveRate}%</div>
            </div>
            <div style={{ background: 'var(--surface-2)', borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em', marginBottom: 4 }}>SHARE RATE</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#2563eb' }}>{patterns.avgShareRate}%</div>
            </div>
          </div>

          {/* Best days & hours detail */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div style={{ background: 'var(--surface-2)', borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 10, letterSpacing: '0.05em' }}>RANKING DE DÍAS</div>
              {patterns.bestDays.map((d, i) => (
                <div key={d.day} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, marginBottom: 8, borderBottom: i < patterns.bestDays.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <span style={{ fontSize: 13, textTransform: 'capitalize' }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'} {d.day}</span>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>{d.avgMultiplier}x <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({d.count} reels)</span></span>
                </div>
              ))}
            </div>
            <div style={{ background: 'var(--surface-2)', borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 10, letterSpacing: '0.05em' }}>RANKING DE HORAS</div>
              {patterns.bestHours.map((h, i) => (
                <div key={h.hour} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, marginBottom: 8, borderBottom: i < patterns.bestHours.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <span style={{ fontSize: 13 }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'} {formatHour(h.hour)}</span>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>{h.avgMultiplier}x <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({h.count} reels)</span></span>
                </div>
              ))}
              {patterns.bestHours.length === 0 && (
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Se necesitan más reels para detectar patrones horarios</p>
              )}
            </div>
          </div>

          {/* AI deep analysis */}
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

          {aiAnalysis && !loading && (
            <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, fontSize: 13.5, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
              {aiAnalysis}
            </div>
          )}
        </>
      )}
    </div>
  )
}
