import { cookies } from 'next/headers'
import { createServerSupabase } from '@/lib/supabase'
import { formatNumber, getRangeBounds } from '@/lib/utils'
import ReelPatterns from '@/components/reels/ReelPatterns'
import FlopAutopsy from '@/components/reels/FlopAutopsy'
import ViralityPredictor from '@/components/reels/ViralityPredictor'
import DateRangeSelect from '@/components/dashboard/DateRangeSelect'

function calcPatterns(reels: any[]) {
  if (reels.length < 3) return null

  const topByMultiplier = [...reels].sort((a, b) => b.multiplier - a.multiplier).slice(0, Math.ceil(reels.length * 0.25))
  const bottomByMultiplier = [...reels].sort((a, b) => a.multiplier - b.multiplier).slice(0, Math.ceil(reels.length * 0.25))

  const avgDurationTop = topByMultiplier.filter((r: any) => r.duration_seconds).length
    ? topByMultiplier.filter((r: any) => r.duration_seconds).reduce((s: number, r: any) => s + r.duration_seconds, 0) /
      topByMultiplier.filter((r: any) => r.duration_seconds).length
    : 0

  const dayPerf: Record<string, { views: number; count: number; multiplier: number }> = {}
  const hourPerf: Record<number, { views: number; count: number; multiplier: number }> = {}

  for (const r of reels) {
    const d = new Date(r.timestamp)
    const day = d.toLocaleDateString('es', { weekday: 'long' })
    const hour = d.getHours()

    if (!dayPerf[day]) dayPerf[day] = { views: 0, count: 0, multiplier: 0 }
    dayPerf[day].views += r.views
    dayPerf[day].count++
    dayPerf[day].multiplier += r.multiplier || 0

    if (!hourPerf[hour]) hourPerf[hour] = { views: 0, count: 0, multiplier: 0 }
    hourPerf[hour].views += r.views
    hourPerf[hour].count++
    hourPerf[hour].multiplier += r.multiplier || 0
  }

  const bestDays = Object.entries(dayPerf)
    .map(([day, d]) => ({ day, avgViews: Math.round(d.views / d.count), avgMultiplier: +(d.multiplier / d.count).toFixed(2), count: d.count }))
    .sort((a, b) => b.avgMultiplier - a.avgMultiplier)

  const bestHours = Object.entries(hourPerf)
    .map(([h, d]) => ({ hour: +h, avgViews: Math.round(d.views / d.count), avgMultiplier: +(d.multiplier / d.count).toFixed(2), count: d.count }))
    .filter(h => h.count >= 2)
    .sort((a, b) => b.avgMultiplier - a.avgMultiplier)

  const avgSaveRate = reels.reduce((s: number, r: any) => s + (r.views > 0 ? (r.saves / r.views) * 100 : 0), 0) / reels.length
  const avgShareRate = reels.reduce((s: number, r: any) => s + (r.views > 0 ? (r.shares / r.views) * 100 : 0), 0) / reels.length

  return {
    optimalDuration: Math.round(avgDurationTop),
    bestDays: bestDays.slice(0, 3),
    bestHours: bestHours.slice(0, 3),
    avgSaveRate: +avgSaveRate.toFixed(2),
    avgShareRate: +avgShareRate.toFixed(2),
    totalReels: reels.length,
    topReels: topByMultiplier.slice(0, 8).map((r: any) => ({
      caption: r.caption?.slice(0, 200),
      hook: r.hook,
      views: r.views,
      multiplier: r.multiplier,
      duration_seconds: r.duration_seconds,
      likes: r.likes,
      comments: r.comments,
      saves: r.saves,
      shares: r.shares,
    })),
    bottomReels: bottomByMultiplier.slice(0, 5).map((r: any) => ({
      caption: r.caption?.slice(0, 200),
      hook: r.hook,
      views: r.views,
      multiplier: r.multiplier,
    })),
  }
}

export default async function RayosXPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const cookieStore = await cookies()
  const accountId = cookieStore.get('ig_account_id')?.value!
  const range = (await searchParams).range || 'all'
  const { start, end } = getRangeBounds(range)

  const db = createServerSupabase()

  let query = db.from('reels').select('*').eq('account_id', accountId).order('timestamp', { ascending: false }).limit(200)
  if (start) query = query.gte('timestamp', start.toISOString())
  if (end) query = query.lt('timestamp', end.toISOString())
  const { data: reels } = await query

  const { data: account } = await db.from('ig_accounts').select('followers_count').eq('id', accountId).single()

  const allReels = reels || []
  const patterns = calcPatterns(allReels)

  const totalViews = allReels.reduce((s: number, r: any) => s + r.views, 0)
  const totalLikes = allReels.reduce((s: number, r: any) => s + r.likes, 0)
  const totalComments = allReels.reduce((s: number, r: any) => s + r.comments, 0)
  const totalShares = allReels.reduce((s: number, r: any) => s + r.shares, 0)
  const totalSaves = allReels.reduce((s: number, r: any) => s + r.saves, 0)

  const engagementRate = totalViews > 0
    ? (((totalLikes + totalComments + totalShares + totalSaves) / totalViews) * 100).toFixed(2)
    : '0'

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 2 }}>Rayos X</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Diagnóstico completo de tu cuenta. Descubrí qué funciona, qué no, y por qué.</p>
        </div>
        <DateRangeSelect current={range} />
      </div>

      {allReels.length === 0 ? (
        <div className="card" style={{ padding: 64, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔬</div>
          <p style={{ color: 'var(--text-muted)', marginBottom: 8, fontSize: 15, fontWeight: 600 }}>No hay reels para analizar</p>
          <p style={{ color: 'var(--text-faint)', fontSize: 13 }}>Sincronizá tus reels primero desde el Dashboard</p>
        </div>
      ) : (
        <>
          {/* Quick stats */}
          <div className="grid-stats-4" style={{ marginBottom: 24 }}>
            {[
              { label: 'REELS ANALIZADOS', value: allReels.length.toString(), icon: '🎬' },
              { label: 'ENGAGEMENT RATE', value: `${engagementRate}%`, icon: '💬' },
              { label: 'VISTAS TOTALES', value: formatNumber(totalViews), icon: '👁' },
              { label: 'SEGUIDORES', value: formatNumber(account?.followers_count || 0), icon: '👥' },
            ].map(s => (
              <div key={s.label} className="metric-card">
                <div style={{ fontSize: 18, marginBottom: 8 }}>{s.icon}</div>
                <div className="stat-label">{s.label}</div>
                <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em' }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Engagement breakdown */}
          <div className="card" style={{ padding: 20, marginBottom: 24 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Engagement por tipo</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Likes', value: totalLikes, color: 'var(--accent)', pct: totalViews > 0 ? ((totalLikes / totalViews) * 100).toFixed(2) : '0' },
                { label: 'Comentarios', value: totalComments, color: '#8b5cf6', pct: totalViews > 0 ? ((totalComments / totalViews) * 100).toFixed(2) : '0' },
                { label: 'Shares', value: totalShares, color: '#2563eb', pct: totalViews > 0 ? ((totalShares / totalViews) * 100).toFixed(2) : '0' },
                { label: 'Guardados', value: totalSaves, color: '#059669', pct: totalViews > 0 ? ((totalSaves / totalViews) * 100).toFixed(2) : '0' },
              ].map(s => (
                <div key={s.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{s.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{formatNumber(s.value)} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({s.pct}%)</span></span>
                  </div>
                  <div style={{ height: 6, background: 'var(--surface-2)', borderRadius: 3 }}>
                    <div style={{ height: '100%', background: s.color, borderRadius: 3, width: `${Math.min(100, parseFloat(s.pct) * 10)}%`, transition: 'width 0.5s' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Patterns */}
          {patterns && <ReelPatterns patterns={patterns} />}

          {/* Virality Predictor */}
          <ViralityPredictor />

          {/* Flop Autopsy */}
          <FlopAutopsy />
        </>
      )}
    </div>
  )
}
