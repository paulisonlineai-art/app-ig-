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
        <div className="onboarding-banner">
          <span className="onboarding-banner-icon">✨</span>
          <div>
            <div className="onboarding-banner-title">Analizando tu Instagram con IA...</div>
            <div className="onboarding-banner-desc">
              Klar está generando tu ADN de Marca automáticamente. Revisá los campos y ajustá lo que quieras.
            </div>
          </div>
        </div>
      )}

      <div style={{ marginBottom: 28 }}>
        <h1 className="dash-greeting">ADN de Marca</h1>
        <p className="dash-subtitle">
          Esta información alimenta la IA de Klar para darte análisis y sugerencias personalizadas.
        </p>
      </div>
      <BrandDNAClient accountId={accountId} initial={brand} isOnboarding={isOnboarding} />
    </div>
  )
}
