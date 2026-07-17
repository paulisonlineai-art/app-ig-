import { cookies } from 'next/headers'
import { createServerSupabase } from '@/lib/supabase'
import { formatNumber, calcAverages, getRangeBounds } from '@/lib/utils'
import ReelsGrid from '@/components/reels/ReelsGrid'
import ReelPatterns from '@/components/reels/ReelPatterns'
import SyncButton from '@/components/dashboard/SyncButton'
import DateRangeSelect from '@/components/dashboard/DateRangeSelect'

function calcPatterns(reels: any[]) {
  if (reels.length < 3) return null

  const withDuration = reels.filter((r: any) => r.duration_seconds)
  const topByMultiplier = [...reels].sort((a, b) => b.multiplier - a.multiplier).slice(0, Math.ceil(reels.length * 0.25))
  const bottomByMultiplier = [...reels].sort((a, b) => a.multiplier - b.multiplier).slice(0, Math.ceil(reels.length * 0.25))

  const avgDurationTop = withDuration.length
    ? topByMultiplier.filter((r: any) => r.duration_seconds).reduce((s: number, r: any) => s + r.duration_seconds, 0) /
      (topByMultiplier.filter((r: any) => r.duration_seconds).length || 1)
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

export default async function ReelsPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const cookieStore = await cookies()
  const accountId = cookieStore.get('ig_account_id')?.value!
  const range = (await searchParams).range || 'all'
  const { start, end } = getRangeBounds(range)

  const db = createServerSupabase()
  let query = db.from('reels').select('*').eq('account_id', accountId).order('timestamp', { ascending: false }).limit(200)
  if (start) query = query.gte('timestamp', start.toISOString())
  if (end) query = query.lt('timestamp', end.toISOString())
  const { data: reels } = await query

  const allReels = reels || []
  const averages = calcAverages(allReels)

  const totalLikes = allReels.reduce((s: number, r: any) => s + r.likes, 0)
  const totalViews = allReels.reduce((s: number, r: any) => s + r.views, 0)

  const patterns = calcPatterns(allReels)

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 2 }}>IG Intelligence</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Análisis profundo de tu cuenta de Instagram.</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <DateRangeSelect current={range} />
          <SyncButton />
        </div>
      </div>

      {allReels.length === 0 ? (
        <div className="card" style={{ padding: 64, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📥</div>
          <p style={{ color: 'var(--text-muted)', marginBottom: 8, fontSize: 15, fontWeight: 600 }}>No hay reels sincronizados</p>
          <p style={{ color: 'var(--text-faint)', fontSize: 13 }}>Hacé clic en "Sincronizar" para importar tus reels de Instagram</p>
        </div>
      ) : (
        <>
          {patterns && <ReelPatterns patterns={patterns} />}
          <ReelsGrid reels={allReels} averages={averages} totalLikes={totalLikes} totalViews={totalViews} />
        </>
      )}
    </div>
  )
}
