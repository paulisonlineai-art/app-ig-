import { cookies } from 'next/headers'
import { createServerSupabase } from '@/lib/supabase'
import IdeasClient from '@/components/ideas/IdeasClient'
import CommentInsights from '@/components/audiencia/CommentInsights'

export default async function IdeasPage() {
  const cookieStore = await cookies()
  const accountId = cookieStore.get('ig_account_id')?.value!

  const db = createServerSupabase()
  const [{ data: topReels }, { data: competitors }, { data: brand }] = await Promise.all([
    db.from('reels').select('id,caption,views,multiplier,like_rate,comment_rate,hook,transcript').eq('account_id', accountId).order('multiplier', { ascending: false }).limit(20),
    db.from('competitors').select('ig_username').eq('account_id', accountId),
    db.from('brand_dna').select('*').eq('account_id', accountId).single(),
  ])

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 2 }}>Klar AI</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
          Tu asistente de contenido con IA. Pedile ideas, análisis, o que saque insights de los comentarios de tu audiencia.
        </p>
      </div>

      <CommentInsights />

      <IdeasClient
        topReels={topReels || []}
        competitors={(competitors || []).map((c: any) => c.ig_username)}
        brandDNA={brand?.content || ''}
        accountId={accountId}
      />
    </div>
  )
}
