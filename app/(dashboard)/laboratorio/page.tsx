import { cookies } from 'next/headers'
import { createServerSupabase } from '@/lib/supabase'
import ViralityPredictor from '@/components/reels/ViralityPredictor'
import HookLab from '@/components/reels/HookLab'
import RecyclableContent from '@/components/reels/RecyclableContent'

export default async function LaboratorioPage() {
  const cookieStore = await cookies()
  const accountId = cookieStore.get('ig_account_id')?.value!

  const db = createServerSupabase()
  const { data: reels } = await db.from('reels').select('caption,hook,views,saves,comments,multiplier,permalink,thumbnail_url').eq('account_id', accountId).order('timestamp', { ascending: false }).limit(200)

  const allReels = (reels || []).map((r: any) => ({
    caption: r.caption,
    hook: r.hook,
    views: r.views,
    saves: r.saves,
    save_rate: r.views > 0 ? (r.saves / r.views) * 100 : 0,
    comment_rate: r.views > 0 ? (r.comments / r.views) * 100 : 0,
    multiplier: r.multiplier,
    permalink: r.permalink,
    thumbnail_url: r.thumbnail_url,
  }))

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 2 }}>Laboratorio</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Experimentá, reciclá y creá tu próximo reel viral.</p>
      </div>

      <ViralityPredictor />
      <HookLab reels={allReels} />
      <RecyclableContent reels={allReels} />
    </div>
  )
}
