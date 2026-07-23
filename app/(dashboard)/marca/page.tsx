import { cookies } from 'next/headers'
import { createServerSupabase } from '@/lib/supabase'
import BrandDNAClient from '@/components/marca/BrandDNAClient'

export default async function MarcaPage({ searchParams }: { searchParams: Promise<{ onboarding?: string }> }) {
  const cookieStore = await cookies()
  const accountId = cookieStore.get('ig_account_id')?.value!
  const isOnboarding = (await searchParams).onboarding === '1'

  const db = createServerSupabase()
  const { data: brand } = await db.from('brand_dna').select('*').eq('account_id', accountId).single()

  return (
    <div>
      {isOnboarding && !brand?.content && (
        <div style={{ background: 'var(--accent-light)', border: '1px solid var(--accent)', borderRadius: 12, padding: '16px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 28 }}>✨</span>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>Analizando tu Instagram con IA...</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Klar está generando tu ADN de Marca automáticamente. Revisá los campos y ajustá lo que quieras.
            </div>
          </div>
        </div>
      )}

      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 2 }}>ADN de Marca</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
          Esta información alimenta la IA de Klar para darte análisis y sugerencias personalizadas.
        </p>
      </div>
      <BrandDNAClient accountId={accountId} initial={brand} isOnboarding={isOnboarding} />
    </div>
  )
}
