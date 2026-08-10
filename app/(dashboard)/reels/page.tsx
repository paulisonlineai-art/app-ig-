import { cookies } from 'next/headers'
import { createServerSupabase } from '@/lib/supabase'
import { getRangeBounds } from '@/lib/utils'
import ReelsGrid from '@/components/reels/ReelsGrid'
import SyncButton from '@/components/dashboard/SyncButton'
import PeriodToggle from '@/components/dashboard/PeriodToggle'
import Badge from '@/components/ui/Badge'
import type { Reel } from '@/types'

const PERIOD_OPTIONS = [
  { value: '7d', label: '7d' },
  { value: '30d', label: '30d' },
  { value: '90d', label: '90d' },
  { value: 'all', label: 'Todo' },
]

export default async function ReelsPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const cookieStore = await cookies()
  const accountId = cookieStore.get('ig_account_id')?.value!
  const range = (await searchParams).range || 'all'
  const { start, end } = getRangeBounds(range)

  const db = createServerSupabase()
  let query = db.from('reels').select('*').eq('account_id', accountId).order('timestamp', { ascending: false }).limit(200)
  if (start) query = query.gte('timestamp', start.toISOString())
  if (end) query = query.lt('timestamp', end.toISOString())
  const [{ data: reels }, { data: lastSync }] = await Promise.all([
    query,
    db.from('reels').select('synced_at').eq('account_id', accountId).order('synced_at', { ascending: false }).limit(1),
  ])

  const allReels = (reels || []) as Reel[]

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
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h1 className="dash-greeting">Mis Reels</h1>
          <Badge variant="primary" size="md">{allReels.length}</Badge>
        </div>
        <div className="dash-header-actions">
          <PeriodToggle current={range} options={PERIOD_OPTIONS} />
          <SyncButton lastSyncLabel={syncLabel} />
        </div>
      </div>

      {allReels.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-state-icon">📥</div>
          <p className="empty-state-title">No hay reels sincronizados</p>
          <p className="empty-state-desc">Hacé clic en &quot;Sincronizar&quot; para importar tus reels de Instagram</p>
        </div>
      ) : (
        <ReelsGrid reels={allReels} />
      )}
    </div>
  )
}
