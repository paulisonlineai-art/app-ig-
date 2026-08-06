import { cookies } from 'next/headers'
import { createServerSupabase } from '@/lib/supabase'
import IdeasClient from '@/components/ideas/IdeasClient'
import CommentInsights from '@/components/audiencia/CommentInsights'
import HookLab from '@/components/reels/HookLab'
import RecyclableContent from '@/components/reels/RecyclableContent'
import CrearTabs from '@/components/crear/CrearTabs'

interface ReelRow {
  caption: string | null
  hook: string | null
  views: number
  saves: number
  comments: number
  multiplier: number
  permalink: string | null
  thumbnail_url: string | null
}

export default async function CrearPage() {
  const cookieStore = await cookies()
  const accountId = cookieStore.get('ig_account_id')?.value!

  const db = createServerSupabase()
  const [{ data: topReels }, { data: competitors }, { data: brand }, { data: commentReels }, { data: labReels }] = await Promise.all([
    db.from('reels').select('id,caption,views,multiplier,like_rate,comment_rate,hook,transcript').eq('account_id', accountId).order('multiplier', { ascending: false }).limit(20),
    db.from('competitors').select('ig_username').eq('account_id', accountId),
    db.from('brand_dna').select('*').eq('account_id', accountId).single(),
    db.from('reels').select('caption,permalink,views,comments,thumbnail_url').eq('account_id', accountId).gt('comments', 0).order('comments', { ascending: false }).limit(30),
    db.from('reels').select('caption,hook,views,saves,comments,multiplier,permalink,thumbnail_url').eq('account_id', accountId).order('timestamp', { ascending: false }).limit(200),
  ])

  const allLabReels = (labReels || []).map((r: ReelRow) => ({
    caption: r.caption,
    hook: r.hook,
    views: r.views,
    saves: r.saves,
    save_rate: r.views > 0 ? (r.saves / r.views) * 100 : 0,
    comment_rate: r.views > 0 ? (r.comments / r.views) * 100 : 0,
    multiplier: r.multiplier,
    permalink: r.permalink || '',
    thumbnail_url: r.thumbnail_url,
  }))

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 className="dash-greeting">Crear</h1>
        <p className="dash-subtitle">
          Ideas, hooks y reciclaje para tu próximo contenido.
        </p>
      </div>

      <CrearTabs>
        {{
          ideas: (
            <>
              <CommentInsights reels={(commentReels || []).map((r: { caption: string | null; permalink: string | null; views: number; comments: number; thumbnail_url: string | null }) => ({
                caption: r.caption || '',
                permalink: r.permalink || '',
                views: r.views || 0,
                comments: r.comments || 0,
                thumbnail_url: r.thumbnail_url ?? undefined,
              }))} />
              <IdeasClient
                topReels={topReels || []}
                competitors={(competitors || []).map((c: { ig_username: string }) => c.ig_username)}
                brandDNA={brand?.content || ''}
                accountId={accountId}
              />
            </>
          ),
          hooks: (
            <HookLab reels={allLabReels} />
          ),
          reciclar: (
            <RecyclableContent reels={allLabReels} />
          ),
        }}
      </CrearTabs>
    </div>
  )
}
