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
    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 3, marginTop: 6 }}>
      <svg width="12" height="12" viewBox="0 0 12 12"><path d="M6 2L10 7H2L6 2Z" fill="currentColor"/></svg>
      Nuevo
    </span>
  )
  const pct = ((val - prev) / prev) * 100
  const up = pct >= 0
  return (
    <span style={{ fontSize: 12, fontWeight: 600, color: up ? 'var(--success)' : 'var(--danger)', display: 'flex', alignItems: 'center', gap: 3, marginTop: 6 }}>
      <svg width="12" height="12" viewBox="0 0 12 12" style={{ transform: up ? 'none' : 'rotate(180deg)' }}>
        <path d="M6 2L10 7H2L6 2Z" fill="currentColor"/>
      </svg>
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

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos días'
  if (h < 18) return 'Buenas tardes'
  return 'Buenas noches'
}

const STAT_ICONS: Record<string, { svg: string; bg: string; fg: string }> = {
  views: {
    svg: '<circle cx="12" cy="12" r="3"/><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>',
    bg: 'rgba(124,58,237,0.08)', fg: '#7c3aed',
  },
  conversations: {
    svg: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    bg: 'rgba(37,99,235,0.08)', fg: '#2563eb',
  },
  comments: {
    svg: '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>',
    bg: 'rgba(217,119,6,0.08)', fg: '#d97706',
  },
  replies: {
    svg: '<polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>',
    bg: 'rgba(5,150,105,0.08)', fg: '#059669',
  },
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
    { data: latestReels },
  ] = await Promise.all([
    reelsQuery,
    reelsPrevQuery || Promise.resolve({ data: [] as any[] }),
    storiesQuery,
    salesQuery.limit(200),
    db.from('audience_stats').select('date,reach,impressions').eq('account_id', accountId).order('date', { ascending: true }).limit(60),
    db.from('ig_accounts').select('followers_count,username').eq('id', accountId).single(),
    db.from('reels').select('timestamp').eq('account_id', accountId).gte('timestamp', new Date(Date.now() - 90 * 864e5).toISOString()).order('timestamp', { ascending: true }),
    db.from('reels').select('caption,views,multiplier,permalink').eq('account_id', accountId).order('timestamp', { ascending: false }).limit(5),
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

  const streakDates = new Set((streakReels || []).map((r: any) => r.timestamp?.split('T')[0]).filter(Boolean))
  let currentStreak = 0
  const today = new Date()
  const todayKey = today.toISOString().split('T')[0]
  const publishedToday = streakDates.has(todayKey)
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
  const pendingAmount = totalRevenue - totalCash

  const byReel: Record<string, { caption: string; thumbnail: string; amount: number; count: number }> = {}
  for (const s of allSales) {
    if (!s.reel_id) continue
    const key = s.reel_id
    if (!byReel[key]) byReel[key] = { caption: (s as any).reels?.caption || '', thumbnail: (s as any).reels?.thumbnail_url || '', amount: 0, count: 0 }
    byReel[key].amount += s.amount
    byReel[key].count++
  }
  const topSources = Object.values(byReel).sort((a, b) => b.amount - a.amount).slice(0, 5)

  const totalLikes = r.reduce((s: number, x: any) => s + x.likes, 0)
  const engRate = views30 > 0 ? (((totalLikes + comments30 + r.reduce((s: number, x: any) => s + x.shares, 0) + r.reduce((s: number, x: any) => s + x.saves, 0)) / views30) * 100).toFixed(1) : '0'

  const stats = [
    { key: 'views', label: 'VISTAS TOTALES', value: formatNumber(views30), prev: viewsPrev, curr: views30 },
    { key: 'conversations', label: 'CONVERSACIONES', value: formatNumber(conversations30), prev: conversationsPrev, curr: conversations30 },
    { key: 'comments', label: 'COMENTARIOS', value: formatNumber(comments30), prev: commentsPrev, curr: comments30 },
    { key: 'replies', label: 'RESPUESTAS HISTORIAS', value: formatNumber(storyReplies) },
  ]

  // Trending reel alert
  const latest = (latestReels || [])[0]
  const avgViews = r.length > 1 ? views30 / r.length : 0
  const isTrending = latest && avgViews > 0 && latest.views > avgViews * 1.2
  const trendPct = avgViews > 0 && latest ? Math.round(((latest.views - avgViews) / avgViews) * 100) : 0

  return (
    <div className="dash-pro">
      {/* Header */}
      <div className="dash-header">
        <div>
          <h1 className="dash-greeting">{getGreeting()}</h1>
          <p className="dash-subtitle">Resumen de rendimiento · {rangeLabel}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <DateRangeSelect current={range} />
          <SyncButton />
        </div>
      </div>

      {/* Trending reel alert */}
      {isTrending && latest && (
        <a href={`/reels`} className="dash-trending">
          <span className="dash-trending-icon">🔥</span>
          <div className="dash-trending-text">
            <strong>Tu último reel está rompiendo</strong>
            <span>{formatNumber(latest.views)} vistas · {trendPct}% sobre tu promedio</span>
          </div>
          <span className="dash-trending-arrow">→</span>
        </a>
      )}

      {/* Streak */}
      <div className={`dash-streak ${publishedToday ? 'streak-active' : 'streak-idle'}`}>
        <div className="streak-left">
          <div className="streak-fire">{publishedToday ? '🔥' : '⚡'}</div>
          <div>
            <div className="streak-count">{currentStreak}</div>
            <div className="streak-label">día{currentStreak !== 1 ? 's' : ''} de racha</div>
          </div>
        </div>
        <div className="streak-msg">
          {publishedToday
            ? currentStreak >= 7
              ? 'Imparable. La constancia es lo que separa a los que crecen.'
              : currentStreak >= 3
                ? 'Buen ritmo. Cada día que publicás, el algoritmo te premia más.'
                : 'Buen inicio. Mantené el ritmo y vas a ver resultados.'
            : currentStreak > 0
              ? `No pierdas tu racha de ${currentStreak} días. Publicá hoy.`
              : 'Hoy no publicaste. Un reel al día cambia todo.'}
        </div>
        {!publishedToday && (
          <div className="streak-cta">Publicá hoy</div>
        )}
      </div>

      {/* Stat cards */}
      <div className="dash-stats">
        {stats.map(s => {
          const icon = STAT_ICONS[s.key]
          return (
            <div key={s.key} className="dash-stat-card">
              <div className="dash-stat-icon" style={{ background: icon.bg }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={icon.fg} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: icon.svg }} />
              </div>
              <div className="dash-stat-label">{s.label}</div>
              <div className="dash-stat-value">{s.value}</div>
              {s.prev !== undefined && <PctChange val={s.curr!} prev={s.prev} />}
            </div>
          )
        })}
      </div>

      {/* Revenue row */}
      <div className="dash-revenue-row">
        <div className="dash-revenue-card">
          <div className="dash-revenue-header">
            <span className="dash-revenue-label">FACTURACIÓN</span>
            <div className="dash-revenue-icon" style={{ background: 'rgba(5,150,105,0.08)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
            </div>
          </div>
          <div className="dash-revenue-amount">{formatCurrency(totalRevenue)}</div>
          <div className="dash-revenue-sub">{allSales.length} venta{allSales.length !== 1 ? 's' : ''} · {rangeLabel.toLowerCase()}</div>
        </div>

        <div className="dash-revenue-card">
          <div className="dash-revenue-header">
            <span className="dash-revenue-label">EFECTIVO COBRADO</span>
            <div className="dash-revenue-icon" style={{ background: 'rgba(37,99,235,0.08)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
              </svg>
            </div>
          </div>
          <div className="dash-revenue-amount" style={{ color: 'var(--success)' }}>{formatCurrency(totalCash)}</div>
          <div className="dash-revenue-sub">{totalRevenue > 0 ? `${((totalCash / totalRevenue) * 100).toFixed(0)}% del total` : '—'}</div>
        </div>

        {pendingAmount > 0 && (
          <div className="dash-revenue-card">
            <div className="dash-revenue-header">
              <span className="dash-revenue-label">POR COBRAR</span>
              <div className="dash-revenue-icon" style={{ background: 'rgba(217,119,6,0.08)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
            </div>
            <div className="dash-revenue-amount" style={{ color: 'var(--warning)' }}>{formatCurrency(pendingAmount)}</div>
            <div className="dash-revenue-sub">pendiente de cobro</div>
          </div>
        )}
      </div>

      {/* Charts */}
      {(audienceStats?.length || 0) > 0 && (
        <DashboardCharts audienceStats={audienceStats || []} reels={r} />
      )}

      {/* Profile Score + Quick Stats side by side */}
      <div className="dash-bottom-row">
        <ProfileScore score={profileScore} />

        <div className="dash-card">
          <div className="dash-card-header">
            <h2 className="dash-card-title">Resumen rápido</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {[
              { label: 'Seguidores', value: formatNumber(account?.followers_count || 0) },
              { label: 'Engagement Rate', value: `${engRate}%` },
              { label: 'Reels este período', value: r.length },
              { label: 'Likes totales', value: formatNumber(totalLikes) },
            ].map((item, i) => (
              <div key={item.label} className="dash-quick-row" style={i === 0 ? { paddingTop: 0 } : undefined}>
                <span className="dash-quick-label">{item.label}</span>
                <span className="dash-quick-value">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top fuentes de facturación */}
      {topSources.length > 0 && (
        <div className="dash-card" style={{ marginTop: 16 }}>
          <div className="dash-card-header">
            <h2 className="dash-card-title">Fuentes de facturación</h2>
            <span className="dash-card-badge">{rangeLabel}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {topSources.map((src, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className="dash-rank">{i + 1}</span>
                {src.thumbnail && <img src={`/api/proxy-image?url=${encodeURIComponent(src.thumbnail)}`} className="dash-source-thumb" alt="" />}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="dash-source-caption">
                    {src.caption?.slice(0, 60) || 'Sin título'}
                  </div>
                  <div className="dash-source-bar-track">
                    <div className="dash-source-bar-fill" style={{ width: `${Math.min(100, (src.amount / topSources[0].amount) * 100)}%` }} />
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div className="dash-source-amount">{formatCurrency(src.amount)}</div>
                  <div className="dash-source-count">{src.count} venta{src.count > 1 ? 's' : ''}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
