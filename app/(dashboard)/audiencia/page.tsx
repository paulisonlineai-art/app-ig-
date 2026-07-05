import { cookies } from 'next/headers'
import { createServerSupabase } from '@/lib/supabase'
import { formatNumber } from '@/lib/utils'

export default async function AudienciaPage() {
  const cookieStore = await cookies()
  const accountId = cookieStore.get('ig_account_id')?.value!

  const db = createServerSupabase()
  const { data: stats } = await db
    .from('audience_stats')
    .select('*')
    .eq('account_id', accountId)
    .order('date', { ascending: false })
    .limit(30)

  const allStats = stats || []
  const latest = allStats[0]
  const avgReach = allStats.length ? allStats.reduce((s: number, r: any) => s + r.reach, 0) / allStats.length : 0

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Audiencia</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 32, fontSize: 14 }}>Métricas profundas de tu audiencia</p>

      {allStats.length === 0 ? (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 48, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>👥</div>
          <p style={{ color: 'var(--text-muted)', marginBottom: 8 }}>Sincronizá tus datos para ver la audiencia</p>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Los datos de audiencia se sincronizan junto con los reels</p>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
            {[
              { label: 'Alcance diario promedio', value: formatNumber(avgReach), icon: '📡' },
              { label: 'Impresiones', value: formatNumber(latest?.impressions || 0), icon: '👁' },
              { label: 'Visitas al perfil', value: formatNumber(latest?.profile_views || 0), icon: '🔍' },
            ].map(s => (
              <div key={s.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20 }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>{s.icon}</div>
                <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>{s.value}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Últimos 30 días</h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Fecha', 'Alcance', 'Impresiones', 'Visitas perfil', 'Seguidores'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allStats.map((s: any) => (
                    <tr key={s.date} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '10px 12px' }}>{new Date(s.date).toLocaleDateString('es')}</td>
                      <td style={{ padding: '10px 12px' }}>{formatNumber(s.reach)}</td>
                      <td style={{ padding: '10px 12px' }}>{formatNumber(s.impressions)}</td>
                      <td style={{ padding: '10px 12px' }}>{formatNumber(s.profile_views || 0)}</td>
                      <td style={{ padding: '10px 12px' }}>{formatNumber(s.followers_count || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
