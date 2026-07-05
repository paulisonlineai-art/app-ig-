import { cookies } from 'next/headers'
import { createServerSupabase } from '@/lib/supabase'
import { formatNumber, calcAverages } from '@/lib/utils'
import ReelsGrid from '@/components/reels/ReelsGrid'
import SyncButton from '@/components/dashboard/SyncButton'

export default async function ReelsPage() {
  const cookieStore = await cookies()
  const accountId = cookieStore.get('ig_account_id')?.value!

  const db = createServerSupabase()
  const { data: reels } = await db
    .from('reels')
    .select('*')
    .eq('account_id', accountId)
    .order('timestamp', { ascending: false })

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
          <select style={{ fontSize: 13, padding: '7px 12px', borderRadius: 8 }}>
            <option>Últimos 90 días</option>
            <option>Últimos 30 días</option>
            <option>Todo el tiempo</option>
          </select>
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
