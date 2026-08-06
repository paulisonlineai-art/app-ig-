import { cookies } from 'next/headers'
import { createServerSupabase } from '@/lib/supabase'
import { formatNumber, formatCurrency, getRangeBounds, DATE_RANGE_OPTIONS } from '@/lib/utils'
import SyncButton from '@/components/dashboard/SyncButton'
import DashboardCharts from '@/components/dashboard/DashboardCharts'
import DateRangeSelect from '@/components/dashboard/DateRangeSelect'

interface Reel {
  views: number
  likes: number
  comments: number
  shares: number
  saves: number
  timestamp: string
  multiplier: number
}

interface Sale {
  amount: number
  cash_collected: number
  closed_at: string
}

function PctChange({ val, prev }: { val: number; prev: number }) {
  if (prev === 0 && val === 0) return null
  if (prev === 0) return <span className="kpi-change kpi-change-new">↑ Nuevo</span>
  const pct = ((val - prev) / prev) * 100
  const up = pct >= 0
  return (
    <span className={`kpi-change ${up ? 'kpi-change-up' : 'kpi-change-down'}`}>
      {up ? '↑' : '↓'} {Math.abs(pct).toFixed(1)}%
    </span>
  )
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

  let salesQuery = db.from('sales').select('amount,cash_collected,closed_at').eq('account_id', accountId).order('closed_at', { ascending: false })
  if (start) salesQuery = salesQuery.gte('closed_at', start.toISOString().split('T')[0])
  if (end) salesQuery = salesQuery.lt('closed_at', end.toISOString().split('T')[0])

  let reelsPrevQuery = prevStart
    ? db.from('reels').select('views,comments,shares,saves').eq('account_id', accountId).gte('timestamp', prevStart.toISOString())
    : null
  if (reelsPrevQuery && prevEnd) reelsPrevQuery = reelsPrevQuery.lt('timestamp', prevEnd.toISOString())

  const [
    { data: reels30 },
    { data: reelsPrev },
    { data: sales30 },
    { data: audienceStats },
    { data: account },
    { data: brandDna },
  ] = await Promise.all([
    reelsQuery,
    reelsPrevQuery || Promise.resolve({ data: [] as Reel[] }),
    salesQuery.limit(200),
    db.from('audience_stats').select('date,reach,impressions').eq('account_id', accountId).order('date', { ascending: true }).limit(60),
    db.from('ig_accounts').select('followers_count,username').eq('id', accountId).single(),
    db.from('brand_dna').select('content').eq('account_id', accountId).single(),
  ])

  const r = (reels30 || []) as Reel[]
  const rp = (reelsPrev || []) as Reel[]

  const views30 = r.reduce((s, x) => s + x.views, 0)
  const viewsPrev = rp.reduce((s, x) => s + x.views, 0)
  const comments30 = r.reduce((s, x) => s + x.comments, 0)
  const commentsPrev = rp.reduce((s, x) => s + x.comments, 0)
  const totalLikes = r.reduce((s, x) => s + x.likes, 0)
  const totalSaves = r.reduce((s, x) => s + x.saves, 0)
  const totalSavesPrev = rp.reduce((s, x) => s + x.saves, 0)
  const totalShares = r.reduce((s, x) => s + x.shares, 0)
  const engRate = views30 > 0 ? (((totalLikes + comments30 + totalShares + totalSaves) / views30) * 100).toFixed(1) : '0'

  const allSales = (sales30 || []) as Sale[]
  const totalRevenue = allSales.reduce((s, x) => s + x.amount, 0)
  const totalCash = allSales.reduce((s, x) => s + x.cash_collected, 0)

  const hasBrandDna = !!brandDna?.content

  const kpis = [
    { label: 'VISTAS', value: formatNumber(views30), prev: viewsPrev, curr: views30, hasPrev: true },
    { label: 'ENGAGEMENT', value: `${engRate}%`, hasPrev: false },
    { label: 'COMENTARIOS', value: formatNumber(comments30), prev: commentsPrev, curr: comments30, hasPrev: true },
    { label: 'GUARDADOS', value: formatNumber(totalSaves), prev: totalSavesPrev, curr: totalSaves, hasPrev: true },
  ]

  const secondaryStats = [
    { label: 'SEGUIDORES', value: formatNumber(account?.followers_count || 0) },
    { label: 'LIKES', value: formatNumber(totalLikes) },
    { label: 'SHARES', value: formatNumber(totalShares) },
    { label: 'REELS', value: String(r.length) },
  ]

  return (
    <div className="dash-pro">
      {/* Header */}
      <div className="dash-header">
        <div>
          <h1 className="dash-greeting">Dashboard</h1>
          <p className="dash-subtitle">{rangeLabel} · {r.length} reel{r.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="dash-header-actions">
          <DateRangeSelect current={range} />
          <SyncButton />
        </div>
      </div>

      {/* Brand DNA banner */}
      {!hasBrandDna && (
        <a href="/marca?onboarding=1" className="brand-banner">
          <span className="brand-banner-icon">🧬</span>
          <div style={{ flex: 1 }}>
            <div className="brand-banner-title">Configurá tu ADN de Marca</div>
            <div className="brand-banner-desc">Klar necesita conocer tu marca para darte sugerencias personalizadas.</div>
          </div>
          <span className="brand-banner-arrow">→</span>
        </a>
      )}

      {/* KPIs */}
      <div className="kpi-grid">
        {kpis.map((kpi, i) => (
          <div key={kpi.label} className="kpi-card" style={{ animationDelay: `${i * 0.06}s` }}>
            <div className="kpi-label">{kpi.label}</div>
            <div className="kpi-value">{kpi.value}</div>
            {kpi.hasPrev && <PctChange val={kpi.curr!} prev={kpi.prev!} />}
          </div>
        ))}
      </div>

      {/* Charts */}
      <DashboardCharts audienceStats={audienceStats || []} reels={r} />

      {/* Secondary stats */}
      <div className="kpi-grid" style={{ marginTop: 16 }}>
        {secondaryStats.map((s, i) => (
          <div key={s.label} className="kpi-card" style={{ animationDelay: `${(i + 4) * 0.06}s` }}>
            <div className="kpi-label">{s.label}</div>
            <div className="kpi-value kpi-value-sm">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Revenue */}
      {(totalRevenue > 0 || allSales.length > 0) && (
        <div className="revenue-grid" style={{ marginTop: 16 }}>
          <div className="revenue-card" style={{ animationDelay: '0.5s' }}>
            <div className="kpi-label">FACTURACIÓN</div>
            <div className="kpi-value">{formatCurrency(totalRevenue)}</div>
            <div className="dash-revenue-sub">{allSales.length} venta{allSales.length !== 1 ? 's' : ''}</div>
          </div>
          <div className="revenue-card revenue-card-accent" style={{ animationDelay: '0.56s' }}>
            <div className="kpi-label">COBRADO</div>
            <div className="kpi-value" style={{ color: 'var(--success)' }}>{formatCurrency(totalCash)}</div>
            <div className="dash-revenue-sub">{totalRevenue > 0 ? `${((totalCash / totalRevenue) * 100).toFixed(0)}% del total` : '—'}</div>
          </div>
        </div>
      )}
    </div>
  )
}
