'use client'

const CATEGORIES = [
  { key: 'engagement', label: 'Engagement', max: 25 },
  { key: 'consistency', label: 'Constancia', max: 25 },
  { key: 'reach', label: 'Alcance', max: 25 },
  { key: 'quality', label: 'Calidad', max: 25 },
] as const

function scoreColor(score: number) {
  if (score >= 80) return '#22c55e'
  if (score >= 60) return '#eab308'
  if (score >= 40) return '#f97316'
  return '#ef4444'
}

function scoreLabel(score: number) {
  if (score >= 80) return 'Excelente'
  if (score >= 60) return 'Bueno'
  if (score >= 40) return 'Regular'
  if (score >= 20) return 'Bajo'
  return 'Crítico'
}

export default function ProfileScore({ score }: {
  score: { total: number; engagement: number; consistency: number; reach: number; quality: number }
}) {
  const color = scoreColor(score.total)
  const circumference = 2 * Math.PI * 40
  const filled = (score.total / 100) * circumference

  return (
    <div className="dash-card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid var(--border)' }}>
        <div className="dash-card-title" style={{ marginBottom: 0 }}>Score de Perfil</div>
      </div>
      <div style={{ padding: '16px 20px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
          <div style={{ position: 'relative', width: 80, height: 80, flexShrink: 0 }}>
            <svg viewBox="0 0 90 90" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
              <circle cx="45" cy="45" r="40" fill="none" stroke="var(--surface-2)" strokeWidth="6" />
              <circle
                cx="45" cy="45" r="40" fill="none"
                stroke={color}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${filled} ${circumference - filled}`}
                style={{ transition: 'stroke-dasharray 1s ease' }}
              />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-0.04em', color, lineHeight: 1 }}>{score.total}</div>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.03em', color }}>{scoreLabel(score.total)}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Basado en 4 métricas clave</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {CATEGORIES.map(cat => {
            const val = score[cat.key]
            const pct = (val / cat.max) * 100
            const barColor = pct >= 80 ? '#22c55e' : pct >= 50 ? '#eab308' : '#ef4444'
            return (
              <div key={cat.key}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)' }}>{cat.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{val}/{cat.max}</span>
                </div>
                <div style={{ height: 5, background: 'var(--surface-2)', borderRadius: 3 }}>
                  <div style={{
                    height: '100%', borderRadius: 3, width: `${pct}%`,
                    background: barColor,
                    transition: 'width 0.5s',
                  }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
