import { cookies } from 'next/headers'
import { createServerSupabase } from '@/lib/supabase'
import ViralityPredictor from '@/components/reels/ViralityPredictor'
import HookLab from '@/components/reels/HookLab'
import RecyclableContent from '@/components/reels/RecyclableContent'
import ReferenciasClient from '@/components/referencias/ReferenciasClient'
import Link from 'next/link'

export default async function LaboratorioPage() {
  const cookieStore = await cookies()
  const accountId = cookieStore.get('ig_account_id')?.value!

  const db = createServerSupabase()
  const [{ data: reels }, { data: refs }, { data: brand }] = await Promise.all([
    db.from('reels').select('caption,hook,views,saves,comments,multiplier,permalink,thumbnail_url').eq('account_id', accountId).order('timestamp', { ascending: false }).limit(200),
    db.from('reference_videos').select('*').eq('account_id', accountId).order('created_at', { ascending: false }),
    db.from('brand_dna').select('content').eq('account_id', accountId).single(),
  ])

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
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 2 }}>Laboratorio</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Experimentá, reciclá y creá tu próximo reel viral.</p>
        </div>
      </div>

      <ViralityPredictor />
      <HookLab />
      <RecyclableContent reels={allReels} />

      {/* Referencias section */}
      <div style={{ marginTop: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 4 }}>Videos de Referencia</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
              Subí un reel de otro creador. Klar lo analiza y te genera una versión adaptada a tu estilo.
            </p>
          </div>
          {!brand?.content && (
            <Link href="/marca" style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--warning-bg)', border: '1px solid var(--warning)', color: 'var(--warning)', padding: '8px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600 }}>
              ⚠ Configurá tu ADN de Marca
            </Link>
          )}
        </div>
        <ReferenciasClient
          references={refs || []}
          accountId={accountId}
          brandDNA={brand?.content || ''}
        />
      </div>
    </div>
  )
}
