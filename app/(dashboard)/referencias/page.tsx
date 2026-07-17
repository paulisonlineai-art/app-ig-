import { cookies } from 'next/headers'
import { createServerSupabase } from '@/lib/supabase'
import ReferenciasClient from '@/components/referencias/ReferenciasClient'
import Link from 'next/link'

export default async function ReferenciasPage() {
  const cookieStore = await cookies()
  const accountId = cookieStore.get('ig_account_id')?.value!

  const db = createServerSupabase()
  const [{ data: refs }, { data: brand }] = await Promise.all([
    db.from('reference_videos').select('*').eq('account_id', accountId).order('created_at', { ascending: false }),
    db.from('brand_dna').select('content').eq('account_id', accountId).single(),
  ])

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 4 }}>Videos de Referencia</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, maxWidth: 520 }}>
            Subí videos de referentes. Klar los transcribe, analiza la estructura y genera una versión adaptada a tu nicho y estilo.
          </p>
        </div>
        {!brand?.content && (
          <Link href="/marca" style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--warning-bg)', border: '1px solid var(--warning)', color: 'var(--warning)', padding: '8px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600 }}>
            ⚠️ Configurá tu ADN de Marca primero
          </Link>
        )}
      </div>

      <ReferenciasClient
        references={refs || []}
        accountId={accountId}
        brandDNA={brand?.content || ''}
      />
    </div>
  )
}
