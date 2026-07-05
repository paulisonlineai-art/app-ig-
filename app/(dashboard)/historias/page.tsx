import { cookies } from 'next/headers'
import { createServerSupabase } from '@/lib/supabase'
import { formatNumber } from '@/lib/utils'

export default async function HistoriasPage() {
  const cookieStore = await cookies()
  const accountId = cookieStore.get('ig_account_id')?.value!

  const db = createServerSupabase()
  const { data: stories } = await db
    .from('stories')
    .select('*')
    .eq('account_id', accountId)
    .order('timestamp', { ascending: false })
    .limit(50)

  const allStories = stories || []

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Historias</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 32, fontSize: 14 }}>
        Métricas de historias — datos que Instagram no te muestra después de 24h
      </p>

      {allStories.length === 0 ? (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 48, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>⭕</div>
          <p style={{ color: 'var(--text-muted)', marginBottom: 8 }}>No hay historias trackeadas</p>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Las historias se sincronizan mientras están activas (primeras 24h)</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {allStories.map((story: any) => (
            <div key={story.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, display: 'flex', gap: 16, alignItems: 'center' }}>
              {story.media_url && (
                <img src={story.media_url} alt="" style={{ width: 54, height: 96, borderRadius: 8, objectFit: 'cover' }} />
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                  {new Date(story.timestamp).toLocaleString('es')}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
                  {[
                    { label: 'Impresiones', value: formatNumber(story.impressions) },
                    { label: 'Alcance', value: formatNumber(story.reach) },
                    { label: 'Respuestas', value: formatNumber(story.replies) },
                    { label: 'Tap fwd', value: formatNumber(story.taps_forward) },
                    { label: 'Drop-off', value: story.dropoff_percentage != null ? `${story.dropoff_percentage.toFixed(1)}%` : '—' },
                  ].map(m => (
                    <div key={m.label} style={{ background: 'var(--surface-2)', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
                      <div style={{ fontSize: 15, fontWeight: 700 }}>{m.value}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{m.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
