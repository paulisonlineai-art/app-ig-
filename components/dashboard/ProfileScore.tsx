'use client'

const CATEGORIES = [
  { key: 'engagement', label: 'Engagement', icon: '💬', max: 25 },
  { key: 'consistency', label: 'Constancia', icon: '📅', max: 25 },
  { key: 'reach', label: 'Alcance', icon: '📡', max: 25 },
  { key: 'quality', label: 'Calidad', icon: '⭐', max: 25 },
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
  const circumference = 2 * Math.PI * 54
  const filled = (score.total / 100) * circumference

  return (
    <div className="card" style={{ padding: 24, marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap' }}>
        {/* Gauge */}
        <div style={{ position: 'relative', width: 130, height: 130, flexShrink: 0 }}>
          <svg viewBox="0 0 120 120" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
            <circle cx="60" cy="60" r="54" fill="none" stroke="var(--surface-2)" strokeWidth="8" />
            <circle
              cx="60" cy="60" r="54" fill="none"
              stroke={color}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${filled} ${circumference - filled}`}
              style={{ transition: 'stroke-dasharray 1s ease' }}
            />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: 36, fontWeight: 900, letterSpacing: '-0.04em', color }}>{score.total}</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>{scoreLabel(score.total)}</div>
          </div>
        </div>

        {/* Breakdown */}
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>Score de Perfil</div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
            Salud general de tu cuenta basada en 4 métricas clave
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {CATEGORIES.map(cat => {
              const val = score[cat.key]
              return (
                <div key={cat.key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{cat.icon} {cat.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{val}/{cat.max}</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--surface-2)', borderRadius: 3 }}>
                    <div style={{
                      height: '100%',
                      borderRadius: 3,
                      width: `${(val / cat.max) * 100}%`,
                      background: val >= cat.max * 0.8 ? '#22c55e' : val >= cat.max * 0.5 ? '#eab308' : '#ef4444',
                      transition: 'width 0.5s',
                    }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
