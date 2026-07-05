import { cookies } from 'next/headers'
import { createServerSupabase } from '@/lib/supabase'
import BrandDNAClient from '@/components/marca/BrandDNAClient'

export default async function MarcaPage() {
  const cookieStore = await cookies()
  const accountId = cookieStore.get('ig_account_id')?.value!

  const db = createServerSupabase()
  const { data: brand } = await db.from('brand_dna').select('*').eq('account_id', accountId).single()

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 2 }}>ADN de Marca</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
          Esta información alimenta la IA de Moka para darte análisis y sugerencias personalizadas.
        </p>
      </div>
      <BrandDNAClient accountId={accountId} initial={brand} />
    </div>
  )
}
