import { cookies } from 'next/headers'
import { createServerSupabase } from '@/lib/supabase'
import AddCompetitorForm from '@/components/competidores/AddCompetitorForm'
import CompetitorCard from '@/components/competidores/CompetitorCard'
import ReferenciasClient from '@/components/referencias/ReferenciasClient'
import Link from 'next/link'
import type { Competitor, CompetitorReel } from '@/types'

interface CompetitorWithReels extends Competitor {
  competitor_reels: CompetitorReel[]
}

export default async function RadarPage() {
  const cookieStore = await cookies()
  const accountId = cookieStore.get('ig_account_id')?.value!

  const db = createServerSupabase()
  const [{ data: competitors }, { data: refs }, { data: brand }] = await Promise.all([
    db.from('competitors')
      .select('*, competitor_reels(*)')
      .eq('account_id', accountId)
      .order('created_at', { ascending: false })
      .order('timestamp', { referencedTable: 'competitor_reels', ascending: false }),
    db.from('reference_videos').select('*').eq('account_id', accountId).order('created_at', { ascending: false }),
    db.from('brand_dna').select('content').eq('account_id', accountId).single(),
  ])

  return (
    <div>
      <h1 className="dash-greeting">Radar IG</h1>
      <p className="dash-subtitle" style={{ marginBottom: 32 }}>
        Analizá los reels de tus competidores y robá lo que funciona (adaptado a tu estilo).
      </p>

      <AddCompetitorForm accountId={accountId} />

      <div style={{ marginTop: 32 }}>
        {competitors?.length ? (
          <div className="competitor-grid">
            {(competitors as CompetitorWithReels[]).map(c => <CompetitorCard key={c.id} competitor={c} />)}
          </div>
        ) : (
          <div className="card empty-state">
            <div className="empty-state-icon">🕵️</div>
            <p className="empty-state-title">Sin competidores todavía</p>
            <p className="empty-state-desc">Agregá el @ de un creador de tu nicho para espiar sus reels</p>
          </div>
        )}
      </div>

      <div style={{ marginTop: 40 }}>
        <div className="section-header-row">
          <div>
            <h2 className="dash-greeting" style={{ fontSize: 18, marginBottom: 4 }}>Videos de Referencia</h2>
            <p className="dash-subtitle">
              Subí un reel de otro creador. Klar lo analiza y te genera una versión adaptada a tu estilo.
            </p>
          </div>
          {!brand?.content && (
            <Link href="/marca" className="warning-link">
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
