import { cookies } from 'next/headers'
import { createServerSupabase } from '@/lib/supabase'
import { formatNumber } from '@/lib/utils'
import AudienciaClient from '@/components/audiencia/AudienciaClient'
import CommentInsights from '@/components/audiencia/CommentInsights'

export default async function AudienciaPage() {
  const cookieStore = await cookies()
  const accountId = cookieStore.get('ig_account_id')?.value!

  const db = createServerSupabase()

  const [{ data: stats }, { data: reels }, { data: account }] = await Promise.all([
    db.from('audience_stats').select('*').eq('account_id', accountId).order('date', { ascending: false }).limit(30),
    db.from('reels').select('id,caption,views,likes,comments,shares,saves,multiplier,like_rate,comment_rate,hook,transcript,timestamp').eq('account_id', accountId).order('timestamp', { ascending: false }).limit(50),
    db.from('ig_accounts').select('username,followers_count').eq('id', accountId).single(),
  ])

  const allStats = stats || []
  const allReels = reels || []
  const latest = allStats[0]
  const avgReach = allStats.length ? allStats.reduce((s: number, r: any) => s + r.reach, 0) / allStats.length : 0

  const totalViews = allReels.reduce((s: number, r: any) => s + r.views, 0)
  const totalLikes = allReels.reduce((s: number, r: any) => s + r.likes, 0)
  const totalComments = allReels.reduce((s: number, r: any) => s + r.comments, 0)
  const totalShares = allReels.reduce((s: number, r: any) => s + r.shares, 0)
  const totalSaves = allReels.reduce((s: number, r: any) => s + r.saves, 0)

  const engagementRate = totalViews > 0
    ? (((totalLikes + totalComments + totalShares + totalSaves) / totalViews) * 100).toFixed(2)
    : '0'

  const topReels = [...allReels].sort((a: any, b: any) => b.multiplier - a.multiplier).slice(0, 10)

  const dayPerformance: Record<string, { views: number; count: number }> = {}
  for (const r of allReels) {
    const day = new Date(r.timestamp).toLocaleDateString('es', { weekday: 'long' })
    if (!dayPerformance[day]) dayPerformance[day] = { views: 0, count: 0 }
    dayPerformance[day].views += r.views
    dayPerformance[day].count++
  }
  const bestDay = Object.entries(dayPerformance).sort((a, b) => (b[1].views / b[1].count) - (a[1].views / a[1].count))[0]

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4, letterSpacing: '-0.03em' }}>Audiencia</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 28, fontSize: 13 }}>
        Análisis profundo de tu audiencia y patrones de engagement
      </p>

      <div className="grid-stats-4" style={{ marginBottom: 24 }}>
        {[
          { label: 'SEGUIDORES', value: formatNumber(account?.followers_count || 0), icon: '👥' },
          { label: 'ALCANCE DIARIO', value: formatNumber(Math.round(avgReach)), icon: '📡' },
          { label: 'ENGAGEMENT RATE', value: `${engagementRate}%`, icon: '💬' },
          { label: 'MEJOR DÍA', value: bestDay ? bestDay[0] : '—', icon: '📊' },
        ].map(s => (
          <div key={s.label} className="metric-card">
            <div style={{ fontSize: 18, marginBottom: 8 }}>{s.icon}</div>
            <div className="stat-label">{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Engagement breakdown */}
      <div className="card" style={{ padding: 20, marginBottom: 24 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Engagement por tipo</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { label: 'Likes', value: totalLikes, color: 'var(--accent)', pct: totalViews > 0 ? ((totalLikes / totalViews) * 100).toFixed(2) : '0' },
            { label: 'Comentarios', value: totalComments, color: '#8b5cf6', pct: totalViews > 0 ? ((totalComments / totalViews) * 100).toFixed(2) : '0' },
            { label: 'Shares', value: totalShares, color: '#2563eb', pct: totalViews > 0 ? ((totalShares / totalViews) * 100).toFixed(2) : '0' },
            { label: 'Guardados', value: totalSaves, color: '#059669', pct: totalViews > 0 ? ((totalSaves / totalViews) * 100).toFixed(2) : '0' },
          ].map(s => (
            <div key={s.label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{s.label}</span>
                <span style={{ fontSize: 13, fontWeight: 700 }}>{formatNumber(s.value)} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({s.pct}%)</span></span>
              </div>
              <div style={{ height: 6, background: 'var(--surface-2)', borderRadius: 3 }}>
                <div style={{ height: '100%', background: s.color, borderRadius: 3, width: `${Math.min(100, parseFloat(s.pct) * 10)}%`, transition: 'width 0.5s' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Comment-based content ideas */}
      <CommentInsights />

      {/* AI Analysis */}
      <AudienciaClient
        topReels={topReels}
        allReels={allReels}
        followers={account?.followers_count || 0}
        engagementRate={engagementRate}
        bestDay={bestDay ? bestDay[0] : ''}
      />

      {/* Day-by-day stats table */}
      {allStats.length > 0 && (
        <div className="card" style={{ padding: 20, marginTop: 24 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Últimos 30 días</h2>
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
      )}
    </div>
  )
}
