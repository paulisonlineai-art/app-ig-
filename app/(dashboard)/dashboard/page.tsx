import { cookies } from 'next/headers'
import { createServerSupabase } from '@/lib/supabase'
import { formatNumber, formatCurrency, getRangeBounds, DATE_RANGE_OPTIONS } from '@/lib/utils'
import SyncButton from '@/components/dashboard/SyncButton'
import DashboardCharts from '@/components/dashboard/DashboardCharts'
import DateRangeSelect from '@/components/dashboard/DateRangeSelect'
import ProfileScore from '@/components/dashboard/ProfileScore'

function PctChange({ val, prev }: { val: number; prev: number }) {
  if (prev === 0 && val === 0) return null
  if (prev === 0) return (
    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 3, marginTop: 4 }}>
      <span>↑</span> Nuevo
    </span>
  )
  const pct = ((val - prev) / prev) * 100
  const up = pct >= 0
  return (
    <span style={{ fontSize: 12, fontWeight: 600, color: up ? 'var(--success)' : 'var(--danger)', display: 'flex', alignItems: 'center', gap: 3, marginTop: 4 }}>
      <span>{up ? '↑' : '↓'}</span>
      {Math.abs(pct).toFixed(1)}% vs anterior
    </span>
  )
}

function calcProfileScore(reels: any[], followers: number) {
  if (!reels.length) return { total: 0, engagement: 0, consistency: 0, reach: 0, quality: 0 }

  const totalViews = reels.reduce((s, r) => s + r.views, 0)
  const totalLikes = reels.reduce((s, r) => s + r.likes, 0)
  const totalComments = reels.reduce((s, r) => s + r.comments, 0)
  const totalShares = reels.reduce((s, r) => s + r.shares, 0)
  const totalSaves = reels.reduce((s, r) => s + r.saves, 0)

  const engRate = totalViews > 0 ? ((totalLikes + totalComments + totalShares + totalSaves) / totalViews) * 100 : 0
  const engScore = Math.min(25, (engRate / 8) * 25)

  const uniqueDays = new Set(reels.filter((r: any) => r.timestamp).map((r: any) => r.timestamp.split('T')[0])).size
  const validTimestamps = reels.filter((r: any) => r.timestamp)
  const span = validTimestamps.length > 1
    ? (new Date(validTimestamps[0].timestamp).getTime() - new Date(validTimestamps[validTimestamps.length - 1].timestamp).getTime()) / 864e5
    : 30
  const frequency = span > 0 ? uniqueDays / (span / 7) : 0
  const consistencyScore = Math.min(25, (frequency / 4) * 25)

  const avgMultiplier = reels.reduce((s: number, r: any) => s + (r.multiplier || 1), 0) / reels.length
  const reachScore = Math.min(25, (avgMultiplier / 3) * 25)

  const saveRate = totalViews > 0 ? (totalSaves / totalViews) * 100 : 0
  const shareRate = totalViews > 0 ? (totalShares / totalViews) * 100 : 0
  const qualityScore = Math.min(25, ((saveRate + shareRate) / 3) * 25)

  const total = Math.round(engScore + consistencyScore + reachScore + qualityScore)

  return {
    total: Math.min(100, total),
    engagement: Math.round(engScore),
    consistency: Math.round(consistencyScore),
    reach: Math.round(reachScore),
    quality: Math.round(qualityScore),
  }
}

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const cookieStore = await cookies()
  const accountId = cookieStore.get('ig_account_id')?.value!
  const range = (await searchParams).range || '30d'
  const { start, end, prevStart, prevEnd } = getRangeBounds(range)
  const rangeLabel = DATE_RANGE_OPTIONS.find(o => o.value === range)?.label || 'Últimos 30 días'

  const db = createServerSupabase()

  let reelsQuery = db.from('reels').select('views,likes,comments,shares,saves,timestamp,multiplier').eq('account_id', accountId)
  if (start) reelsQuery = reelsQuery.gte('timestamp', start.toISOString())
  if (end) reelsQuery = reelsQuery.lt('timestamp', end.toISOString())

  let storiesQuery = db.from('stories').select('replies').eq('account_id', accountId)
  if (start) storiesQuery = storiesQuery.gte('timestamp', start.toISOString())
  if (end) storiesQuery = storiesQuery.lt('timestamp', end.toISOString())

  let salesQuery = db.from('sales').select('amount,cash_collected,closed_at,reel_id,reels(caption,thumbnail_url)').eq('account_id', accountId).order('closed_at', { ascending: false })
  if (start) salesQuery = salesQuery.gte('closed_at', start.toISOString().split('T')[0])
  if (end) salesQuery = salesQuery.lt('closed_at', end.toISOString().split('T')[0])

  let reelsPrevQuery = prevStart
    ? db.from('reels').select('views,comments,shares').eq('account_id', accountId).gte('timestamp', prevStart.toISOString())
    : null
  if (reelsPrevQuery && prevEnd) reelsPrevQuery = reelsPrevQuery.lt('timestamp', prevEnd.toISOString())

  const [
    { data: reels30 },
    { data: reelsPrev },
    { data: stories30 },
    { data: sales30 },
    { data: audienceStats },
    { data: account },
    { data: streakReels },
  ] = await Promise.all([
    reelsQuery,
    reelsPrevQuery || Promise.resolve({ data: [] as any[] }),
    storiesQuery,
    salesQuery.limit(200),
    db.from('audience_stats').select('date,reach,impressions').eq('account_id', accountId).order('date', { ascending: true }).limit(60),
    db.from('ig_accounts').select('followers_count').eq('id', accountId).single(),
    db.from('reels').select('timestamp').eq('account_id', accountId).gte('timestamp', new Date(Date.now() - 90 * 864e5).toISOString()).order('timestamp', { ascending: true }),
  ])

  const r = reels30 || []
  const rp = reelsPrev || []
  const profileScore = calcProfileScore(r, account?.followers_count || 0)

  const views30 = r.reduce((s: number, x: any) => s + x.views, 0)
  const viewsPrev = rp.reduce((s: number, x: any) => s + x.views, 0)
  const comments30 = r.reduce((s: number, x: any) => s + x.comments, 0)
  const commentsPrev = rp.reduce((s: number, x: any) => s + x.comments, 0)
  const conversations30 = r.reduce((s: number, x: any) => s + x.comments + x.shares, 0)
  const conversationsPrev = rp.reduce((s: number, x: any) => s + x.comments + x.shares, 0)
  const storyReplies = (stories30 || []).reduce((s: number, x: any) => s + (x.replies ?? 0), 0)

  // Streak calculation
  const streakDates = new Set((streakReels || []).map((r: any) => r.timestamp?.split('T')[0]).filter(Boolean))
  let currentStreak = 0
  const today = new Date()
  for (let i = 0; i < 90; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().split('T')[0]
    if (streakDates.has(key)) {
      currentStreak++
    } else {
      break
    }
  }

  const allSales = sales30 || []
  const totalRevenue = allSales.reduce((s: number, x: any) => s + x.amount, 0)
  const totalCash = allSales.reduce((s: number, x: any) => s + x.cash_collected, 0)

  // Group sales by reel for "top fuentes de facturación"
  const byReel: Record<string, { caption: string; thumbnail: string; amount: number; count: number }> = {}
  for (const s of allSales) {
    if (!s.reel_id) continue
    const key = s.reel_id
    if (!byReel[key]) byReel[key] = { caption: (s as any).reels?.caption || '', thumbnail: (s as any).reels?.thumbnail_url || '', amount: 0, count: 0 }
    byReel[key].amount += s.amount
    byReel[key].count++
  }
  const topSources = Object.values(byReel).sort((a, b) => b.amount - a.amount).slice(0, 5)

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 2, letterSpacing: '-0.03em' }}>Dashboard</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Resumen global de tu marca personal.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <DateRangeSelect current={range} />
          <SyncButton />
        </div>
      </div>

      {/* Profile Score */}
      <ProfileScore score={profileScore} />

      <div className="grid-dashboard">
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Top stats row */}
          <div className="grid-stats-4">
            {[
              { label: 'VISTAS TOTALES', value: formatNumber(views30), prev: viewsPrev, curr: views30, icon: '👁' },
              { label: 'CONVERSACIONES GENERADAS', value: formatNumber(conversations30), prev: conversationsPrev, curr: conversations30, icon: '💬' },
              { label: 'COMENTARIOS', value: formatNumber(comments30), prev: commentsPrev, curr: comments30, icon: '🗨' },
              { label: 'RACHA', value: `${currentStreak}d`, icon: '🔥' },
            ].map(s => (
              <div key={s.label} className="metric-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 18 }}>{s.icon}</span>
                </div>
                <div className="stat-label">{s.label}</div>
                <div className="stat-value">{s.value}</div>
                {s.prev !== undefined && <PctChange val={s.curr!} prev={s.prev} />}
              </div>
            ))}
          </div>

          {/* Charts */}
          {(audienceStats?.length || 0) > 0 && (
            <DashboardCharts audienceStats={audienceStats || []} reels={r} />
          )}

          {/* Top fuentes de facturación */}
          {topSources.length > 0 && (
            <div className="card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h2 style={{ fontSize: 14, fontWeight: 700 }}>Top fuentes de facturación</h2>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{rangeLabel.toUpperCase()}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {topSources.map((src, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', width: 16 }}>{i + 1}</span>
                    {src.thumbnail && <img src={`/api/proxy-image?url=${encodeURIComponent(src.thumbnail)}`} style={{ width: 36, height: 52, borderRadius: 6, objectFit: 'cover' }} alt="Reel fuente de venta" />}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {src.caption?.slice(0, 60) || 'Sin título'}
                      </div>
                      <div style={{ height: 4, background: 'var(--surface-2)', borderRadius: 2 }}>
                        <div style={{ height: '100%', background: 'var(--accent)', borderRadius: 2, width: `${Math.min(100, (src.amount / topSources[0].amount) * 100)}%` }} />
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--accent)' }}>{formatCurrency(src.amount)}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{src.count} venta{src.count > 1 ? 's' : ''}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column — revenue + quick stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span className="stat-label">FACTURACIÓN</span>
              <span style={{ fontSize: 16 }}>$</span>
            </div>
            <div style={{ fontSize: 30, fontWeight: 900, color: 'var(--accent)', letterSpacing: '-0.04em' }}>
              {formatCurrency(totalRevenue)}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{rangeLabel.toLowerCase()}</div>
          </div>

          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span className="stat-label">EFECTIVO RECOLECTADO</span>
              <span style={{ fontSize: 16 }}>$</span>
            </div>
            <div style={{ fontSize: 30, fontWeight: 900, color: 'var(--success)', letterSpacing: '-0.04em' }}>
              {formatCurrency(totalCash)}
            </div>
          </div>

          <div className="card" style={{ padding: 20 }}>
            <span className="stat-label" style={{ display: 'block', marginBottom: 8 }}>RESUMEN RÁPIDO</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Reels este período', value: r.length },
                { label: 'Likes totales', value: formatNumber(r.reduce((s: number, x: any) => s + x.likes, 0)) },
                { label: 'Comentarios totales', value: formatNumber(r.reduce((s: number, x: any) => s + x.comments, 0)) },
                { label: 'Ventas registradas', value: allSales.length },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{item.label}</span>
                  <span style={{ fontSize: 14, fontWeight: 700 }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
