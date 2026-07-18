import { cookies } from 'next/headers'
import { createServerSupabase } from '@/lib/supabase'
import AddCompetitorForm from '@/components/competidores/AddCompetitorForm'
import CompetitorCard from '@/components/competidores/CompetitorCard'
import ReferenciasClient from '@/components/referencias/ReferenciasClient'
import Link from 'next/link'

export default async function EspiaPage() {
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
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4, letterSpacing: '-0.03em' }}>Espía</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 32, fontSize: 13 }}>
        Analizá los reels de tus competidores y robá lo que funciona (adaptado a tu estilo).
      </p>

      <AddCompetitorForm accountId={accountId} />

      <div style={{ marginTop: 32 }}>
        {competitors?.length ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {competitors.map((c: any) => <CompetitorCard key={c.id} competitor={c} />)}
          </div>
        ) : (
          <div className="card" style={{ padding: 48, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🕵️</div>
            <p style={{ color: 'var(--text-muted)', marginBottom: 8, fontSize: 15, fontWeight: 600 }}>Sin competidores todavía</p>
            <p style={{ color: 'var(--text-faint)', fontSize: 13 }}>Agregá el @ de un creador de tu nicho para espiar sus reels</p>
          </div>
        )}
      </div>

      {/* Videos de Referencia */}
      <div style={{ marginTop: 40 }}>
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
