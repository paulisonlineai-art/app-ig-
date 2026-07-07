import { cookies } from 'next/headers'
import { createServerSupabase } from '@/lib/supabase'
import { formatNumber, calcAverages, getRangeBounds } from '@/lib/utils'
import ReelsGrid from '@/components/reels/ReelsGrid'
import SyncButton from '@/components/dashboard/SyncButton'
import DateRangeSelect from '@/components/dashboard/DateRangeSelect'

export default async function ReelsPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const cookieStore = await cookies()
  const accountId = cookieStore.get('ig_account_id')?.value!
  // Defaults to "todo el tiempo" here (unlike Dashboard's 30d default) since
  // that's the behavior this page always had — picking a range narrows it.
  const range = (await searchParams).range || 'all'
  const { start, end } = getRangeBounds(range)

  const db = createServerSupabase()
  let query = db.from('reels').select('*').eq('account_id', accountId).order('timestamp', { ascending: false })
  if (start) query = query.gte('timestamp', start.toISOString())
  if (end) query = query.lt('timestamp', end.toISOString())
  const { data: reels } = await query

  const allReels = reels || []
  const averages = calcAverages(allReels)

  const totalLikes = allReels.reduce((s: number, r: any) => s + r.likes, 0)
  const totalSaves = allReels.reduce((s: number, r: any) => s + r.saves, 0)
  const totalViews = allReels.reduce((s: number, r: any) => s + r.views, 0)

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
        <ReelsGrid reels={allReels} averages={averages} totalLikes={totalLikes} totalSaves={totalSaves} totalViews={totalViews} />
      )}
    </div>
  )
}
