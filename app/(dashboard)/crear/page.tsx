import { cookies } from 'next/headers'
import { createServerSupabase } from '@/lib/supabase'
import IdeasClient from '@/components/ideas/IdeasClient'
import CommentInsights from '@/components/audiencia/CommentInsights'
import ViralityPredictor from '@/components/reels/ViralityPredictor'
import HookLab from '@/components/reels/HookLab'
import RecyclableContent from '@/components/reels/RecyclableContent'
import ContentPipeline from '@/components/contenido/ContentPipeline'
import CrearTabs from '@/components/crear/CrearTabs'

const STAGES = [
  { id: 'idea', label: 'Ideas', color: '#7c3aed' },
  { id: 'ready_to_record', label: 'Listo para grabar', color: '#2563eb' },
  { id: 'raw_recorded', label: 'Video crudo', color: '#d97706' },
  { id: 'editing', label: 'En edición', color: '#db2777' },
  { id: 'ready_to_publish', label: 'Listo para publicar', color: '#059669' },
  { id: 'published', label: 'Publicado', color: '#374151' },
]

export default async function CrearPage() {
  const cookieStore = await cookies()
  const accountId = cookieStore.get('ig_account_id')?.value!

  const db = createServerSupabase()
  const [{ data: topReels }, { data: competitors }, { data: brand }, { data: commentReels }, { data: labReels }, { data: pieces }] = await Promise.all([
    db.from('reels').select('id,caption,views,multiplier,like_rate,comment_rate,hook,transcript').eq('account_id', accountId).order('multiplier', { ascending: false }).limit(20),
    db.from('competitors').select('ig_username').eq('account_id', accountId),
    db.from('brand_dna').select('*').eq('account_id', accountId).single(),
    db.from('reels').select('caption,permalink,views,comments,thumbnail_url').eq('account_id', accountId).gt('comments', 0).order('comments', { ascending: false }).limit(30),
    db.from('reels').select('caption,hook,views,saves,comments,multiplier,permalink,thumbnail_url').eq('account_id', accountId).order('timestamp', { ascending: false }).limit(200),
    db.from('content_pieces').select('*').eq('account_id', accountId).order('position'),
  ])

  const allLabReels = (labReels || []).map((r: any) => ({
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
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 2 }}>Crear</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
          Ideas, herramientas y pipeline para tu próximo contenido.
        </p>
      </div>

      <CrearTabs>
        {{
          ideas: (
            <>
              <CommentInsights reels={(commentReels || []).map((r: any) => ({
                caption: r.caption || '',
                permalink: r.permalink || '',
                views: r.views || 0,
                comments: r.comments || 0,
                thumbnail_url: r.thumbnail_url,
              }))} />
              <IdeasClient
                topReels={topReels || []}
                competitors={(competitors || []).map((c: any) => c.ig_username)}
                brandDNA={brand?.content || ''}
                accountId={accountId}
              />
            </>
          ),
          lab: (
            <>
              <ViralityPredictor />
              <HookLab />
              <RecyclableContent reels={allLabReels} />
            </>
          ),
          pipeline: (
            <ContentPipeline pieces={pieces || []} stages={STAGES} accountId={accountId} />
          ),
        }}
      </CrearTabs>
    </div>
  )
}
