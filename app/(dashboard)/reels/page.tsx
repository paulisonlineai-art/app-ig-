import { cookies } from 'next/headers'
import { createServerSupabase } from '@/lib/supabase'
import { calcAverages, getRangeBounds } from '@/lib/utils'
import ReelsGrid from '@/components/reels/ReelsGrid'
import SyncButton from '@/components/dashboard/SyncButton'
import DateRangeSelect from '@/components/dashboard/DateRangeSelect'
import type { Reel } from '@/types'

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

  const allReels = (reels || []) as Reel[]
  const averages = calcAverages(allReels)
  const totalLikes = allReels.reduce((s, r) => s + r.likes, 0)
  const totalViews = allReels.reduce((s, r) => s + r.views, 0)

  return (
    <div className="dash-pro">
      <div className="dash-header">
        <div>
          <h1 className="dash-greeting">Reels</h1>
          <p className="dash-subtitle">Todos tus reels sincronizados.</p>
        </div>
        <div className="dash-header-actions">
          <DateRangeSelect current={range} />
          <SyncButton />
        </div>
      </div>

      {allReels.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-state-icon">📥</div>
          <p className="empty-state-title">No hay reels sincronizados</p>
          <p className="empty-state-desc">Hacé clic en &quot;Sincronizar&quot; para importar tus reels de Instagram</p>
        </div>
      ) : (
        <ReelsGrid reels={allReels} averages={averages} totalLikes={totalLikes} totalViews={totalViews} />
      )}
    </div>
  )
}
