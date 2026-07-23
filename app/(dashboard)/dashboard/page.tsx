import { cookies } from 'next/headers'
import { createServerSupabase } from '@/lib/supabase'
import { formatNumber, formatCurrency, getRangeBounds, DATE_RANGE_OPTIONS } from '@/lib/utils'
import SyncButton from '@/components/dashboard/SyncButton'
import DashboardCharts from '@/components/dashboard/DashboardCharts'
import DateRangeSelect from '@/components/dashboard/DateRangeSelect'

function PctChange({ val, prev }: { val: number; prev: number }) {
  if (prev === 0 && val === 0) return null
  if (prev === 0) return (
    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--success)', marginTop: 2 }}>Nuevo</span>
  )
  const pct = ((val - prev) / prev) * 100
  const up = pct >= 0
  return (
    <span style={{ fontSize: 11, fontWeight: 600, color: up ? 'var(--success)' : 'var(--danger)', marginTop: 2 }}>
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
    reelsPrevQuery || Promise.resolve({ data: [] as any[] }),
    salesQuery.limit(200),
    db.from('audience_stats').select('date,reach,impressions').eq('account_id', accountId).order('date', { ascending: true }).limit(60),
    db.from('ig_accounts').select('followers_count,username').eq('id', accountId).single(),
    db.from('brand_dna').select('content').eq('account_id', accountId).single(),
  ])

  const r = reels30 || []
  const rp = reelsPrev || []

  const views30 = r.reduce((s: number, x: any) => s + x.views, 0)
  const viewsPrev = rp.reduce((s: number, x: any) => s + x.views, 0)
  const comments30 = r.reduce((s: number, x: any) => s + x.comments, 0)
  const commentsPrev = rp.reduce((s: number, x: any) => s + x.comments, 0)
  const totalLikes = r.reduce((s: number, x: any) => s + x.likes, 0)
  const totalSaves = r.reduce((s: number, x: any) => s + x.saves, 0)
  const totalSavesPrev = rp.reduce((s: number, x: any) => s + x.saves, 0)
  const totalShares = r.reduce((s: number, x: any) => s + x.shares, 0)
  const engRate = views30 > 0 ? (((totalLikes + comments30 + totalShares + totalSaves) / views30) * 100).toFixed(1) : '0'

  const allSales = sales30 || []
  const totalRevenue = allSales.reduce((s: number, x: any) => s + x.amount, 0)
  const totalCash = allSales.reduce((s: number, x: any) => s + x.cash_collected, 0)

  const hasBrandDna = !!brandDna?.content

  return (
    <div className="dash-pro">
      {/* Header */}
      <div className="dash-header">
        <div>
          <h1 className="dash-greeting">Dashboard</h1>
          <p className="dash-subtitle">{rangeLabel} · {r.length} reel{r.length !== 1 ? 's' : ''}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <DateRangeSelect current={range} />
          <SyncButton />
        </div>
      </div>

      {/* Brand DNA banner */}
      {!hasBrandDna && (
        <a href="/marca?onboarding=1" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', background: 'var(--accent-light)', border: '1px solid var(--accent)', borderRadius: 12, marginBottom: 16, textDecoration: 'none' }}>
          <span style={{ fontSize: 20 }}>🧬</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Configurá tu ADN de Marca</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Klar necesita conocer tu marca para darte sugerencias personalizadas.</div>
          </div>
          <span style={{ color: 'var(--accent)', fontWeight: 600, fontSize: 13 }}>→</span>
        </a>
      )}

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Vistas', value: formatNumber(views30), prev: viewsPrev, curr: views30 },
          { label: 'Engagement', value: `${engRate}%` },
          { label: 'Comentarios', value: formatNumber(comments30), prev: commentsPrev, curr: comments30 },
          { label: 'Guardados', value: formatNumber(totalSaves), prev: totalSavesPrev, curr: totalSaves },
        ].map(s => (
          <div key={s.label} className="dash-stat-card">
            <div className="dash-stat-label">{s.label}</div>
            <div className="dash-stat-value">{s.value}</div>
            {'prev' in s && s.prev !== undefined && <PctChange val={s.curr!} prev={s.prev} />}
          </div>
        ))}
      </div>

      {/* Extra stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Seguidores', value: formatNumber(account?.followers_count || 0) },
          { label: 'Likes', value: formatNumber(totalLikes) },
          { label: 'Shares', value: formatNumber(totalShares) },
          { label: 'Reels', value: String(r.length) },
        ].map(s => (
          <div key={s.label} className="dash-stat-card">
            <div className="dash-stat-label">{s.label}</div>
            <div className="dash-stat-value">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      {(audienceStats?.length || 0) > 0 && (
        <DashboardCharts audienceStats={audienceStats || []} reels={r} />
      )}

      {/* Revenue */}
      {(totalRevenue > 0 || allSales.length > 0) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 20 }}>
          <div className="dash-stat-card" style={{ padding: '16px 20px' }}>
            <div className="dash-stat-label">Facturación</div>
            <div className="dash-stat-value">{formatCurrency(totalRevenue)}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{allSales.length} venta{allSales.length !== 1 ? 's' : ''}</div>
          </div>
          <div className="dash-stat-card" style={{ padding: '16px 20px' }}>
            <div className="dash-stat-label">Cobrado</div>
            <div className="dash-stat-value" style={{ color: 'var(--success)' }}>{formatCurrency(totalCash)}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{totalRevenue > 0 ? `${((totalCash / totalRevenue) * 100).toFixed(0)}% del total` : '—'}</div>
          </div>
        </div>
      )}
    </div>
  )
}
