import { cookies } from 'next/headers'
import { createServerSupabase } from '@/lib/supabase'
import AddCompetitorForm from '@/components/competidores/AddCompetitorForm'
import CompetitorCard from '@/components/competidores/CompetitorCard'

export default async function CompetidoresPage() {
  const cookieStore = await cookies()
  const accountId = cookieStore.get('ig_account_id')?.value!

  const db = createServerSupabase()
  const { data: competitors } = await db
    .from('competitors')
    .select('*, competitor_reels(*)')
    .eq('account_id', accountId)
    .order('created_at', { ascending: false })
    .order('timestamp', { referencedTable: 'competitor_reels', ascending: false })

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Competidores</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 32, fontSize: 14 }}>
        Analizá los reels de tus competidores como si tuvieras acceso a su cuenta
      </p>

      <AddCompetitorForm accountId={accountId} />

      <div style={{ marginTop: 32 }}>
        {competitors?.length ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {competitors.map((c: any) => <CompetitorCard key={c.id} competitor={c} />)}
          </div>
        ) : (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 48, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🕵️</div>
            <p style={{ color: 'var(--text-muted)' }}>Agregá competidores para empezar a analizarlos</p>
          </div>
        )}
      </div>
    </div>
  )
}
