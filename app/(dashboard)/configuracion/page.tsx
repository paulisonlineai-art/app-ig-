import { cookies } from 'next/headers'
import { createServerSupabase } from '@/lib/supabase'
import PaymentIntegrationsForm from '@/components/settings/PaymentIntegrationsForm'
import RefreshProfileButton from '@/components/settings/RefreshProfileButton'

export default async function ConfiguracionPage() {
  const cookieStore = await cookies()
  const accountId = cookieStore.get('ig_account_id')?.value!
  const db = createServerSupabase()
  const { data: account } = await db.from('ig_accounts').select('*').eq('id', accountId).single()

  return (
    <div style={{ maxWidth: 600 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 2 }}>Settings</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Configuración de tu cuenta Klar</p>
      </div>

      <div className="card" style={{ padding: 24, marginBottom: 16 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Cuenta de Instagram conectada</h2>
        {account ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {account.profile_picture_url && <img src={`/api/proxy-image?url=${encodeURIComponent(account.profile_picture_url)}`} style={{ width: 52, height: 52, borderRadius: '50%' }} alt={`Foto de perfil de @${account.username}`} />}
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>@{account.username}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>{account.followers_count?.toLocaleString()} seguidores</div>
              <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 4 }}>
                Token expira: {account.token_expires_at ? new Date(account.token_expires_at).toLocaleDateString('es') : '—'}
              </div>
            </div>
          </div>
        ) : (
          <p style={{ color: 'var(--text-muted)' }}>No hay cuenta conectada</p>
        )}
        <a href="/connect" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 16, fontSize: 13, color: 'var(--accent)', fontWeight: 600 }}>
          → Reconectar Instagram
        </a>
        <RefreshProfileButton />
      </div>

      <div className="card" style={{ padding: 24 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Integraciones de pago</h2>
        <PaymentIntegrationsForm accountId={accountId} initial={account} />
      </div>
    </div>
  )
}
