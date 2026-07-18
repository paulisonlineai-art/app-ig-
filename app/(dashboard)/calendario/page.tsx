import { cookies } from 'next/headers'
import { createServerSupabase } from '@/lib/supabase'
import ConstanciaClient from '@/components/constancia/ConstanciaClient'

export default async function CalendarioPage() {
  const cookieStore = await cookies()
  const accountId = cookieStore.get('ig_account_id')?.value!

  const db = createServerSupabase()

  const ninetyDaysAgo = new Date(Date.now() - 90 * 864e5).toISOString()

  const [{ data: reels }, { data: stories }] = await Promise.all([
    db.from('reels').select('timestamp,views,likes,comments').eq('account_id', accountId).gte('timestamp', ninetyDaysAgo).order('timestamp', { ascending: true }),
    db.from('stories').select('timestamp').eq('account_id', accountId).gte('timestamp', ninetyDaysAgo).order('timestamp', { ascending: true }),
  ])

  const publishDates: Record<string, { reels: number; stories: number; views: number }> = {}

  for (const r of reels || []) {
    const day = r.timestamp.split('T')[0]
    if (!publishDates[day]) publishDates[day] = { reels: 0, stories: 0, views: 0 }
    publishDates[day].reels++
    publishDates[day].views += r.views || 0
  }

  for (const s of stories || []) {
    const day = s.timestamp.split('T')[0]
    if (!publishDates[day]) publishDates[day] = { reels: 0, stories: 0, views: 0 }
    publishDates[day].stories++
  }

  const totalDays = Object.keys(publishDates).length
  const totalReels = (reels || []).length
  const totalStories = (stories || []).length

  const last30 = new Date(Date.now() - 30 * 864e5)
  const daysLast30 = Object.keys(publishDates).filter(d => new Date(d) >= last30).length

  let currentStreak = 0
  let maxStreak = 0
  let tempStreak = 0
  let streakBroken = false
  const today = new Date()
  for (let i = 0; i < 90; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().split('T')[0]
    if (publishDates[key]) {
      tempStreak++
    } else {
      if (!streakBroken) {
        currentStreak = tempStreak
        streakBroken = true
      }
      maxStreak = Math.max(maxStreak, tempStreak)
      tempStreak = 0
    }
  }
  maxStreak = Math.max(maxStreak, tempStreak)
  if (!streakBroken) currentStreak = tempStreak

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4, letterSpacing: '-0.03em' }}>Calendario</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 28, fontSize: 13 }}>
        Tu calendario de publicación de los últimos 90 días
      </p>

      <div className="grid-stats-4" style={{ marginBottom: 28 }}>
        {[
          { label: 'DÍAS ACTIVOS (90D)', value: totalDays, icon: '📅' },
          { label: 'DÍAS ACTIVOS (30D)', value: daysLast30, icon: '🔥' },
          { label: 'RACHA ACTUAL', value: `${currentStreak}d`, icon: '⚡' },
          { label: 'RACHA MÁXIMA', value: `${maxStreak}d`, icon: '🏆' },
        ].map(s => (
          <div key={s.label} className="metric-card">
            <div style={{ fontSize: 18, marginBottom: 8 }}>{s.icon}</div>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid-stats-3" style={{ marginBottom: 28 }}>
        {[
          { label: 'REELS PUBLICADOS', value: totalReels },
          { label: 'STORIES PUBLICADAS', value: totalStories },
          { label: 'FRECUENCIA', value: totalDays > 0 ? `${(totalReels / (totalDays || 1)).toFixed(1)} reels/día activo` : '—' },
        ].map(s => (
          <div key={s.label} className="metric-card">
            <div className="stat-label">{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em' }}>{s.value}</div>
          </div>
        ))}
      </div>

      <ConstanciaClient publishDates={publishDates} />
    </div>
  )
}
