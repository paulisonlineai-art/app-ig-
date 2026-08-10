import { cookies } from 'next/headers'
import { createServerSupabase } from '@/lib/supabase'
import { formatNumber, getRangeBounds } from '@/lib/utils'
import { Eye, Heart, Users, Bookmark } from 'lucide-react'
import KPICard from '@/components/ui/KPICard'
import Card from '@/components/ui/Card'
import SyncButton from '@/components/dashboard/SyncButton'
import PeriodToggle from '@/components/dashboard/PeriodToggle'
import DashboardCharts from '@/components/dashboard/DashboardCharts'
import BestReelsTable, { type BestReel } from '@/components/dashboard/BestReelsTable'
import RecentActivity, { type ActivityItem } from '@/components/dashboard/RecentActivity'

interface ReelRow {
  id: string
  views: number
  likes: number
  comments: number
  shares: number
  saves: number
  reach: number
  timestamp: string
  thumbnail_url: string | null
  caption: string | null
}

interface ReelAgg {
  views: number
  likes: number
  comments: number
  shares: number
  saves: number
  reach: number
}

function pctChange(curr: number, prev: number): { value: number; direction: 'up' | 'down' } | undefined {
  if (prev === 0) return undefined
  const pct = ((curr - prev) / prev) * 100
  return { value: pct, direction: pct >= 0 ? 'up' : 'down' }
}

function sum<T>(arr: T[], pick: (x: T) => number): number {
  return arr.reduce((s, x) => s + pick(x), 0)
}

const VALID_RANGES = new Set(['7d', '30d', '90d'])

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const cookieStore = await cookies()
  const accountId = cookieStore.get('ig_account_id')?.value!
  const rawRange = (await searchParams).range || '30d'
  const range = VALID_RANGES.has(rawRange) ? rawRange : '30d'
  const { start, prevStart, prevEnd } = getRangeBounds(range)

  const db = createServerSupabase()

  const [
    { data: currentReels },
    { data: prevReels },
    { data: recentReels },
    { data: allReelsAgg },
    { data: lastSync },
  ] = await Promise.all([
    db.from('reels')
      .select('id,views,likes,comments,shares,saves,reach,timestamp,thumbnail_url,caption')
      .eq('account_id', accountId)
      .gte('timestamp', start!.toISOString())
      .order('views', { ascending: false }),
    db.from('reels')
      .select('views,likes,comments,shares,saves,reach')
      .eq('account_id', accountId)
      .gte('timestamp', prevStart!.toISOString())
      .lt('timestamp', prevEnd!.toISOString()),
    db.from('reels')
      .select('id,views,timestamp,caption')
      .eq('account_id', accountId)
      .order('timestamp', { ascending: false })
      .limit(15),
    db.from('reels').select('likes,comments,shares,saves').eq('account_id', accountId),
    db.from('reels').select('synced_at').eq('account_id', accountId).order('synced_at', { ascending: false }).limit(1),
  ])

  const curr = (currentReels || []) as ReelRow[]
  const prev = (prevReels || []) as ReelAgg[]
  const recent = (recentReels || []) as { id: string; views: number; timestamp: string; caption: string | null }[]
  const allAgg = (allReelsAgg || []) as { likes: number; comments: number; shares: number; saves: number }[]

  const views = sum(curr, (r) => r.views)
  const viewsPrev = sum(prev, (r) => r.views)
  const reach = sum(curr, (r) => r.reach)
  const reachPrev = sum(prev, (r) => r.reach)
  const saves = sum(curr, (r) => r.saves)
  const savesPrev = sum(prev, (r) => r.saves)

  const interactions = sum(curr, (r) => r.likes + r.comments + r.shares + r.saves)
  const interactionsPrev = sum(prev, (r) => r.likes + r.comments + r.shares + r.saves)
  const engRate = views > 0 ? (interactions / views) * 100 : 0
  const engRatePrev = viewsPrev > 0 ? (interactionsPrev / viewsPrev) * 100 : 0

  const kpis = [
    { label: 'Vistas Totales', value: formatNumber(views), trend: pctChange(views, viewsPrev), icon: Eye, color: 'var(--kpi-blue)' },
    { label: 'Engagement Rate', value: `${engRate.toFixed(1)}%`, trend: pctChange(engRate, engRatePrev), icon: Heart, color: 'var(--kpi-pink)' },
    { label: 'Alcance Total', value: formatNumber(reach), trend: pctChange(reach, reachPrev), icon: Users, color: 'var(--kpi-green)' },
    { label: 'Guardados Totales', value: formatNumber(saves), trend: pctChange(saves, savesPrev), icon: Bookmark, color: 'var(--kpi-purple)' },
  ]

  const topReels: BestReel[] = curr.slice(0, 5).map((r) => ({
    id: r.id,
    thumbnail_url: r.thumbnail_url,
    caption: r.caption,
    views: r.views,
    likes: r.likes,
    comments: r.comments,
    saves: r.saves,
    timestamp: r.timestamp,
  }))

  const activity: ActivityItem[] = recent.slice(0, 5).map((r) => ({ id: r.id, caption: r.caption, timestamp: r.timestamp }))

  const n = allAgg.length || 1
  const engagementAvg = {
    likes: sum(allAgg, (r) => r.likes) / n,
    comments: sum(allAgg, (r) => r.comments) / n,
    saves: sum(allAgg, (r) => r.saves) / n,
    shares: sum(allAgg, (r) => r.shares) / n,
  }

  const syncedAt = (lastSync as { synced_at: string }[] | null)?.[0]?.synced_at
  const syncLabel = syncedAt
    ? (() => {
        const diff = Date.now() - new Date(syncedAt).getTime()
        if (diff < 3600_000) return `hace ${Math.round(diff / 60_000)}m`
        if (diff < 86400_000) return `hace ${Math.round(diff / 3600_000)}h`
        return `hace ${Math.round(diff / 86400_000)}d`
      })()
    : null

  return (
    <div className="dash-pro">
      <div className="dash-header">
        <div>
          <h1 className="dash-greeting">Dashboard</h1>
          <p className="dash-subtitle">{curr.length} reel{curr.length !== 1 ? 's' : ''} en el período</p>
        </div>
        <div className="dash-header-actions">
          <PeriodToggle current={range} />
          <SyncButton lastSyncLabel={syncLabel} />
        </div>
      </div>

      {/* Section 1 — KPI cards */}
      <div className="grid-stats-4" style={{ marginBottom: 20 }}>
        {kpis.map((kpi) => (
          <KPICard
            key={kpi.label}
            label={kpi.label}
            value={kpi.value}
            trend={kpi.trend}
            accentColor={kpi.color}
            icon={<kpi.icon size={18} strokeWidth={1.75} color={kpi.color} />}
          />
        ))}
      </div>

      {/* Section 2 — Charts */}
      <div style={{ marginBottom: 20 }}>
        <DashboardCharts recentReels={recent} engagementAvg={engagementAvg} />
      </div>

      {/* Section 3 — Mejores Reels */}
      <Card padding="none" style={{ marginBottom: 20, overflow: 'hidden' }}>
        <div className="chart-card-header" style={{ borderBottom: '1px solid var(--border)' }}>
          <span className="chart-card-title">Mejores Reels</span>
        </div>
        {topReels.length > 0 ? (
          <BestReelsTable reels={topReels} />
        ) : (
          <div className="empty-state">
            <p className="empty-state-title">Sin reels en este período</p>
            <p className="empty-state-desc">Probá con un rango de fechas más amplio.</p>
          </div>
        )}
      </Card>

      {/* Section 4 — Actividad Reciente */}
      <Card>
        <div className="chart-card-title" style={{ marginBottom: 8 }}>Actividad Reciente</div>
        <RecentActivity items={activity} />
      </Card>
    </div>
  )
}
