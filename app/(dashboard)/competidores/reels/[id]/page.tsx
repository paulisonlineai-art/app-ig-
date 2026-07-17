import { cookies } from 'next/headers'
import { createServerSupabase } from '@/lib/supabase'
import { formatNumber } from '@/lib/utils'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import CompetitorReelAdapt from '@/components/competidores/CompetitorReelAdapt'
import SaveReelButton from '@/components/competidores/SaveReelButton'
import BenchmarkChart from '@/components/reels/detail/BenchmarkChart'

function DeltaBadge({ actual, benchmark }: { actual: number; benchmark: number }) {
  if (!benchmark) return null
  const pct = ((actual - benchmark) / benchmark) * 100
  const up = pct >= 0
  return (
    <div style={{ marginTop: 4, fontSize: 11, fontWeight: 600, color: up ? 'var(--success)' : 'var(--danger)' }}>
      {up ? '↑' : '↓'} {Math.abs(pct).toFixed(0)}% más {up ? 'alto' : 'bajo'} que su propio promedio
    </div>
  )
}

export default async function CompetitorReelDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cookieStore = await cookies()
  const accountId = cookieStore.get('ig_account_id')?.value!

  const db = createServerSupabase()

  const { data: reel } = await db
    .from('competitor_reels')
    .select('*, competitors!inner(account_id, ig_username, profile_picture_url)')
    .eq('id', id)
    .eq('competitors.account_id', accountId)
    .single()

  if (!reel) notFound()

  const { data: allReels } = await db
    .from('competitor_reels')
    .select('views,likes,comments')
    .eq('competitor_id', reel.competitor_id)

  const rated = (allReels || []).map(r => ({
    views: r.views || 0,
    like_rate: r.views ? ((r.likes || 0) / r.views) * 100 : 0,
    comment_rate: r.views ? ((r.comments || 0) / r.views) * 100 : 0,
  }))
  const n = rated.length || 1
  const avgViews = rated.reduce((s, r) => s + r.views, 0) / n
  const avgLikeRate = rated.reduce((s, r) => s + r.like_rate, 0) / n
  const avgCommentRate = rated.reduce((s, r) => s + r.comment_rate, 0) / n

  const views = reel.views || 0
  const likeRate = views ? ((reel.likes || 0) / views) * 100 : 0
  const commentRate = views ? ((reel.comments || 0) / views) * 100 : 0
  const multiplier = avgViews ? views / avgViews : 1

  const competitor = (reel as any).competitors

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <Link href="/competidores" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>
          ← Volver a Competidores
        </Link>
        <SaveReelButton reelId={reel.id} initialSaved={!!reel.saved} />
      </div>

      <div className="grid-detail">
        {/* Left — video preview */}
        <div>
          <div style={{ background: '#000', borderRadius: 16, overflow: 'hidden', position: 'relative', paddingBottom: '177%' }}>
            {reel.thumbnail_url && (
              <img src={`/api/proxy-image?url=${encodeURIComponent(reel.thumbnail_url)}`} alt={`Reel de @${competitor?.ig_username}`} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }} />
            )}
            <div style={{ position: 'absolute', top: 10, left: 10 }}>
              <span className={`badge-multiplier ${multiplier >= 2 ? 'badge-up' : multiplier >= 0.7 ? 'badge-avg' : 'badge-down'}`}>
                ×{multiplier.toFixed(1)}
              </span>
            </div>
          </div>
          <a href={reel.permalink} target="_blank" rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 10, padding: '9px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>
            📱 Abrir en Instagram ↗
          </a>
        </div>

        {/* Right — metrics */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              {competitor?.profile_picture_url && (
                <img src={`/api/proxy-image?url=${encodeURIComponent(competitor.profile_picture_url)}`} alt={`Foto de perfil de @${competitor.ig_username}`} style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
              )}
              <span style={{ fontWeight: 700, fontSize: 14 }}>@{competitor?.ig_username}</span>
            </div>
            <h1 style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 8, lineHeight: 1.4 }}>
              {reel.caption?.split('\n')[0] || 'Sin título'}
            </h1>
            <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>
              {reel.timestamp && new Date(reel.timestamp).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>

          {/* Key metrics row */}
          <div className="grid-stats-4">
            {[
              { label: 'Views', value: formatNumber(views), icon: '👁' },
              { label: 'Me gusta', value: formatNumber(reel.likes || 0), rate: likeRate, benchmark: avgLikeRate, icon: '♥' },
              { label: 'Comentarios', value: formatNumber(reel.comments || 0), rate: commentRate, benchmark: avgCommentRate, icon: '💬' },
              { label: 'Multiplicador', value: `×${multiplier.toFixed(2)}`, icon: '📈' },
            ].map(m => (
              <div key={m.label} className="metric-card" style={{ padding: 14 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.04em', marginBottom: 6, textTransform: 'uppercase' }}>{m.label}</div>
                <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>{m.value}</div>
                {m.rate !== undefined && <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>{m.rate.toFixed(2)}% de vistas</div>}
                {m.benchmark !== undefined && <DeltaBadge actual={m.rate!} benchmark={m.benchmark} />}
              </div>
            ))}
          </div>

          <BenchmarkChart
            reel={{ like_rate: likeRate, comment_rate: commentRate }}
            avgs={{ avg_like_rate: avgLikeRate, avg_comment_rate: avgCommentRate }}
          />
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <CompetitorReelAdapt reel={reel} />
      </div>
    </div>
  )
}
