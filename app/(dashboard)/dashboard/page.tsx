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
    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 2, marginTop: 4 }}>
      <svg width="10" height="10" viewBox="0 0 12 12"><path d="M6 2L10 7H2L6 2Z" fill="currentColor"/></svg>
      Nuevo
    </span>
  )
  const pct = ((val - prev) / prev) * 100
  const up = pct >= 0
  return (
    <span style={{ fontSize: 11, fontWeight: 600, color: up ? 'var(--success)' : 'var(--danger)', display: 'flex', alignItems: 'center', gap: 2, marginTop: 4 }}>
      <svg width="10" height="10" viewBox="0 0 12 12" style={{ transform: up ? 'none' : 'rotate(180deg)' }}>
        <path d="M6 2L10 7H2L6 2Z" fill="currentColor"/>
      </svg>
      {Math.abs(pct).toFixed(1)}%
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
    { data: brandDna },
  ] = await Promise.all([
    reelsQuery,
    reelsPrevQuery || Promise.resolve({ data: [] as any[] }),
    storiesQuery,
    salesQuery.limit(200),
    db.from('audience_stats').select('date,reach,impressions').eq('account_id', accountId).order('date', { ascending: true }).limit(60),
    db.from('ig_accounts').select('followers_count,username').eq('id', accountId).single(),
    db.from('reels').select('timestamp').eq('account_id', accountId).gte('timestamp', new Date(Date.now() - 90 * 864e5).toISOString()).order('timestamp', { ascending: true }),
    db.from('reels').select('caption,views,multiplier,permalink').eq('account_id', accountId).order('timestamp', { ascending: false }).limit(5),
    db.from('brand_dna').select('content').eq('account_id', accountId).single(),
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
  const totalLikes = r.reduce((s: number, x: any) => s + x.likes, 0)
  const totalSaves = r.reduce((s: number, x: any) => s + x.saves, 0)
  const totalShares = r.reduce((s: number, x: any) => s + x.shares, 0)
  const engRate = views30 > 0 ? (((totalLikes + comments30 + totalShares + totalSaves) / views30) * 100).toFixed(1) : '0'

  const streakDates = new Set((streakReels || []).map((r: any) => r.timestamp?.split('T')[0]).filter(Boolean))
  let currentStreak = 0
  const today = new Date()
  const todayKey = today.toISOString().split('T')[0]
  const publishedToday = streakDates.has(todayKey)
  for (let i = 0; i < 90; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().split('T')[0]
    if (streakDates.has(key)) currentStreak++
    else break
  }

  const allSales = sales30 || []
  const totalRevenue = allSales.reduce((s: number, x: any) => s + x.amount, 0)
  const totalCash = allSales.reduce((s: number, x: any) => s + x.cash_collected, 0)

  const latest = (latestReels || [])[0]
  const avgViews = r.length > 1 ? views30 / r.length : 0
  const isTrending = latest && avgViews > 0 && latest.views > avgViews * 1.2
  const trendPct = avgViews > 0 && latest ? Math.round(((latest.views - avgViews) / avgViews) * 100) : 0

  const hasBrandDna = !!brandDna?.content

  return (
    <div className="dash-pro">
      {/* Header */}
      <div className="dash-header">
        <div>
          <h1 className="dash-greeting">{getGreeting()}</h1>
          <p className="dash-subtitle">{rangeLabel}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <DateRangeSelect current={range} />
          <SyncButton />
        </div>
      </div>

      {/* Brand DNA banner */}
      {!hasBrandDna && (
        <a href="/marca?onboarding=1" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', background: 'var(--accent-light)', border: '1px solid var(--accent)', borderRadius: 12, marginBottom: 16, textDecoration: 'none', transition: 'opacity 0.15s' }}>
          <span style={{ fontSize: 24 }}>🧬</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Configurá tu ADN de Marca</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Klar necesita conocer tu marca para darte sugerencias personalizadas.</div>
          </div>
          <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: 13 }}>Configurar →</span>
        </a>
      )}

      {/* Trending reel alert */}
      {isTrending && latest && (
        <a href="/reels" className="dash-trending">
          <span className="dash-trending-icon">🔥</span>
          <div className="dash-trending-text">
            <strong>Tu último reel está rompiendo</strong>
            <span>{formatNumber(latest.views)} vistas · {trendPct}% sobre tu promedio</span>
          </div>
          <span className="dash-trending-arrow">→</span>
        </a>
      )}

      {/* Streak bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 16px', borderRadius: 10, marginBottom: 16,
        background: publishedToday ? 'rgba(5,150,105,0.06)' : 'var(--surface-2)',
        border: publishedToday ? '1px solid rgba(5,150,105,0.15)' : '1px solid var(--border)',
      }}>
        <span style={{ fontSize: 18 }}>{publishedToday ? '🔥' : '⚡'}</span>
        <span style={{ fontSize: 22, fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: 'var(--text)' }}>{currentStreak}</span>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>día{currentStreak !== 1 ? 's' : ''} de racha</span>
        <span style={{ marginLeft: 'auto', fontSize: 12, color: publishedToday ? 'var(--success)' : 'var(--text-muted)', fontWeight: 600 }}>
          {publishedToday
            ? currentStreak >= 7 ? 'Imparable' : currentStreak >= 3 ? 'Buen ritmo' : '✓ Publicaste hoy'
            : 'Publicá hoy para mantener la racha'}
        </span>
      </div>

      {/* Main KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'Vistas', value: formatNumber(views30), prev: viewsPrev, curr: views30, color: '#7c3aed' },
          { label: 'Engagement', value: `${engRate}%`, color: '#2563eb' },
          { label: 'Comentarios', value: formatNumber(comments30), prev: commentsPrev, curr: comments30, color: '#d97706' },
          { label: 'Guardados', value: formatNumber(totalSaves), color: '#059669' },
        ].map(s => (
          <div key={s.label} className="dash-stat-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div className="dash-stat-label">{s.label}</div>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color }} />
            </div>
            <div className="dash-stat-value">{s.value}</div>
            {'prev' in s && s.prev !== undefined && <PctChange val={s.curr!} prev={s.prev} />}
          </div>
        ))}
      </div>

      {/* Score + Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16, marginBottom: 16 }}>
        <ProfileScore score={profileScore} />
        {(audienceStats?.length || 0) > 0 ? (
          <DashboardCharts audienceStats={audienceStats || []} reels={r} />
        ) : <div />}
      </div>

      {/* Revenue section */}
      {(totalRevenue > 0 || allSales.length > 0) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
          <div className="dash-revenue-card">
            <div className="dash-revenue-header">
              <span className="dash-revenue-label">FACTURACIÓN</span>
            </div>
            <div className="dash-revenue-amount">{formatCurrency(totalRevenue)}</div>
            <div className="dash-revenue-sub">{allSales.length} venta{allSales.length !== 1 ? 's' : ''}</div>
          </div>
          <div className="dash-revenue-card">
            <div className="dash-revenue-header">
              <span className="dash-revenue-label">COBRADO</span>
            </div>
            <div className="dash-revenue-amount" style={{ color: 'var(--success)' }}>{formatCurrency(totalCash)}</div>
            <div className="dash-revenue-sub">{totalRevenue > 0 ? `${((totalCash / totalRevenue) * 100).toFixed(0)}% del total` : '—'}</div>
          </div>
        </div>
      )}

      {/* Quick stats */}
      <div className="dash-card" style={{ marginTop: 16 }}>
        <div className="dash-card-header">
          <h2 className="dash-card-title">Resumen</h2>
          <span className="dash-card-badge">{rangeLabel}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0 }}>
          {[
            { label: 'Seguidores', value: formatNumber(account?.followers_count || 0) },
            { label: 'Reels', value: String(r.length) },
            { label: 'Likes', value: formatNumber(totalLikes) },
            { label: 'Shares', value: formatNumber(totalShares) },
          ].map(item => (
            <div key={item.label} style={{ textAlign: 'center', padding: '12px 8px' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{item.value}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
