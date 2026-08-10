import { cookies } from 'next/headers'
import { createServerSupabase } from '@/lib/supabase'
import { formatNumber, formatCurrency, calcAverages } from '@/lib/utils'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ExternalLink, Eye, Heart, MessageCircle, Bookmark } from 'lucide-react'
import ReelDetailClient from '@/components/reels/detail/ReelDetailClient'
import BenchmarkChart from '@/components/reels/detail/BenchmarkChart'
import PerformanceVsAvg from '@/components/reels/detail/PerformanceVsAvg'
import TrackingLinkCard from '@/components/reels/detail/TrackingLinkCard'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import KPICard from '@/components/ui/KPICard'

function extractHashtags(caption: string | null): string[] {
  if (!caption) return []
  return Array.from(new Set(caption.match(/#[\p{L}\p{N}_]+/gu) || [])).slice(0, 10)
}

export default async function ReelDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cookieStore = await cookies()
  const accountId = cookieStore.get('ig_account_id')?.value!

  const db = createServerSupabase()
  const [{ data: reel }, { data: allReels }, { data: sales }] = await Promise.all([
    db.from('reels').select('*').eq('id', id).eq('account_id', accountId).single(),
    db.from('reels').select('views,likes,comments,shares,saves,like_rate,comment_rate,words_per_minute,timestamp').eq('account_id', accountId),
    db.from('sales').select('amount,cash_collected').eq('account_id', accountId).eq('reel_id', id),
  ])

  if (!reel) notFound()

  const others = allReels || []
  const n = others.length || 1
  const avgs = calcAverages(others)
  const avgLikes = others.reduce((s, r) => s + r.likes, 0) / n
  const avgComments = others.reduce((s, r) => s + r.comments, 0) / n
  const avgSaves = others.reduce((s, r) => s + r.saves, 0) / n
  const totalSales = (sales || []).reduce((s: number, x: { amount: number }) => s + x.amount, 0)

  const totalViewsAll = others.reduce((s, r) => s + r.views, 0)
  const totalInteractionsAll = others.reduce((s, r) => s + r.likes + r.comments + r.shares + r.saves, 0)
  const accountEngRate = totalViewsAll > 0 ? (totalInteractionsAll / totalViewsAll) * 100 : 0
  const reelEngRate = reel.views > 0 ? ((reel.likes + reel.comments + reel.shares + reel.saves) / reel.views) * 100 : 0
  const engColor = reelEngRate >= accountEngRate * 1.1 ? 'var(--success)' : reelEngRate <= accountEngRate * 0.9 ? 'var(--danger)' : 'var(--warning)'

  const dayViews: Record<number, number[]> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] }
  for (const r of others) {
    const day = new Date(r.timestamp).getDay()
    dayViews[day].push(r.views)
  }
  const dayAvg = Object.entries(dayViews).map(([d, vs]) => ({
    day: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][+d],
    avg: vs.length ? vs.reduce((a, b) => a + b, 0) / vs.length : 0,
  }))

  const reelDay = new Date(reel.timestamp).getDay()
  const bestDay = dayAvg.reduce((best, d) => d.avg > best.avg ? d : best, dayAvg[0])
  const hashtags = extractHashtags(reel.caption)
  const captionFirstLine = reel.caption?.split('\n')[0] || 'Sin título'

  return (
    <div>
      <Link href="/reels" style={{ marginBottom: 16, display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>
        <ArrowLeft size={15} /> Volver a Reels
      </Link>

      <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 20, lineHeight: 1.3 }}>
        {captionFirstLine}
      </h1>

      <div className="grid-detail">
        {/* Left column (60%) */}
        <div>
          <div className="video-preview">
            {reel.thumbnail_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`/api/proxy-image?url=${encodeURIComponent(reel.thumbnail_url)}`} alt={captionFirstLine.slice(0, 80)} className="video-preview-img" />
            )}
            <div className="video-overlay-tl">
              <span className={`badge-multiplier ${reel.multiplier >= 2 ? 'badge-up' : reel.multiplier >= 0.7 ? 'badge-avg' : 'badge-down'}`}>
                ×{reel.multiplier.toFixed(1)}
              </span>
            </div>
            {reel.duration_seconds && (
              <div className="video-overlay-tr">
                {Math.floor(reel.duration_seconds / 60)}:{String(reel.duration_seconds % 60).padStart(2, '0')}
              </div>
            )}
          </div>

          <a href={reel.permalink} target="_blank" rel="noopener noreferrer" className="btn btn-ghost" style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 10, fontSize: 13 }}>
            Abrir en Instagram <ExternalLink size={13} />
          </a>

          <Card style={{ marginTop: 16 }}>
            <div className="detail-label" style={{ marginBottom: 8 }}>Caption completo</div>
            <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
              {reel.caption || 'Sin descripción'}
            </p>
            <div className="detail-sublabel" style={{ marginTop: 10 }}>
              Publicado el {new Date(reel.timestamp).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })}
              {reel.is_trial && <span className="pill pill-active" style={{ marginLeft: 8, fontSize: 11 }}>Trial Reel</span>}
            </div>
            {hashtags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
                {hashtags.map((h) => (
                  <Badge key={h} variant="default" size="sm">{h}</Badge>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right column (40%) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="grid-stats-4" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
            <KPICard label="Vistas" value={formatNumber(reel.views)} accentColor="var(--kpi-blue)" icon={<Eye size={16} strokeWidth={1.75} color="var(--kpi-blue)" />} />
            <KPICard label="Likes" value={formatNumber(reel.likes)} accentColor="var(--kpi-pink)" icon={<Heart size={16} strokeWidth={1.75} color="var(--kpi-pink)" />} />
            <KPICard label="Comentarios" value={formatNumber(reel.comments)} accentColor="var(--kpi-green)" icon={<MessageCircle size={16} strokeWidth={1.75} color="var(--kpi-green)" />} />
            <KPICard label="Guardados" value={formatNumber(reel.saves)} accentColor="var(--kpi-purple)" icon={<Bookmark size={16} strokeWidth={1.75} color="var(--kpi-purple)" />} />
          </div>

          <Card>
            <div className="detail-label" style={{ marginBottom: 4 }}>Rendimiento vs Promedio</div>
            <div className="detail-sublabel" style={{ marginBottom: 8 }}>% respecto al promedio de tu cuenta</div>
            <PerformanceVsAvg
              metrics={[
                { label: 'Vistas', value: reel.views, avg: avgs.avg_views },
                { label: 'Likes', value: reel.likes, avg: avgLikes },
                { label: 'Comentarios', value: reel.comments, avg: avgComments },
                { label: 'Guardados', value: reel.saves, avg: avgSaves },
              ]}
            />
          </Card>

          <Card>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div className="detail-label">Engagement Rate</div>
                <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', marginTop: 4 }}>{reelEngRate.toFixed(1)}%</div>
              </div>
              <span style={{ width: 12, height: 12, borderRadius: '50%', background: engColor, flexShrink: 0 }} />
            </div>
            <div className="detail-sublabel" style={{ marginTop: 6 }}>Promedio de cuenta: {accountEngRate.toFixed(1)}%</div>

            <div style={{ display: 'flex', gap: 20, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
              <div>
                <div className="detail-sublabel">Alcance</div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{formatNumber(reel.reach || 0)}</div>
              </div>
              <div>
                <div className="detail-sublabel">Compartidos</div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{formatNumber(reel.shares || 0)}</div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid-detail-charts-2" style={{ marginTop: 20 }}>
        <BenchmarkChart reel={reel} avgs={avgs} />

        <Card>
          <div className="detail-label" style={{ marginBottom: 4 }}>Views por día de semana</div>
          <div className="detail-sublabel" style={{ marginBottom: 16 }}>Distribución de views de tu cuenta</div>
          <div className="day-bar-chart">
            {dayAvg.map((d) => {
              const maxAvg = Math.max(...dayAvg.map(x => x.avg), 1)
              const isReel = dayAvg.indexOf(d) === reelDay
              const isBest = d.day === bestDay.day
              return (
                <div key={d.day} className="day-bar-col">
                  <div className="day-bar" style={{ background: isReel ? 'var(--primary)' : isBest ? 'var(--primary-light)' : 'var(--surface-2)', height: `${(d.avg / maxAvg) * 64}px`, border: isBest ? '1.5px solid var(--primary)' : undefined }} />
                  <div className="day-bar-label" style={{ color: isReel ? 'var(--primary)' : undefined, fontWeight: isReel ? 700 : undefined }}>{d.day}</div>
                </div>
              )
            })}
          </div>
          {bestDay && (
            <div className="detail-highlight" style={{ marginTop: 12, display: 'flex', gap: 6, fontSize: 12 }}>
              <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Día con más views: {bestDay.day}</span>
              <span style={{ color: 'var(--text-muted)' }}>— {formatNumber(Math.round(bestDay.avg))} views promedio</span>
            </div>
          )}
        </Card>
      </div>

      {/* VS Benchmark + Ratios + Transcript */}
      <div className="grid-detail-3col" style={{ marginTop: 16 }}>
        <Card>
          <div className="detail-label" style={{ marginBottom: 16 }}>VS Benchmark 90d</div>
          {[
            { label: 'Me gusta', actual: reel.likes, rate: reel.like_rate, bRate: avgs.avg_like_rate, color: 'var(--kpi-pink)' },
            { label: 'Comentarios', actual: reel.comments, rate: reel.comment_rate, bRate: avgs.avg_comment_rate, color: 'var(--kpi-green)' },
          ].map(m => {
            const pct = m.bRate > 0 ? ((m.rate - m.bRate) / m.bRate) * 100 : 0
            const up = pct >= 0
            return (
              <div key={m.label} className="benchmark-row">
                <div className="benchmark-header">
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{m.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: up ? 'var(--success)' : 'var(--danger)' }}>
                    {formatNumber(m.actual)} <span style={{ fontWeight: 400 }}>({up ? '+' : ''}{pct.toFixed(0)}%)</span>
                  </span>
                </div>
                <div className="engagement-bar-track" style={{ height: 4 }}>
                  <div className="engagement-bar-fill" style={{ background: m.color, width: `${Math.min(100, (m.rate / Math.max(m.bRate * 2, 0.01)) * 100)}%` }} />
                </div>
                <div className="stat-tile-sub">Benchmark: {m.bRate.toFixed(2)}%</div>
              </div>
            )
          })}
        </Card>

        <Card>
          <div className="detail-label" style={{ marginBottom: 16 }}>Ratios clave</div>
          <p className="detail-sublabel" style={{ marginBottom: 12 }}>Proporciones con denominador real</p>
          {[
            { label: 'Interacciones / Views', value: `${reelEngRate.toFixed(2)}%`, sub: `${formatNumber(reel.likes + reel.comments + reel.shares + reel.saves)} de ${formatNumber(reel.views)}`, note: 'engagement bruto' },
            { label: 'Shares / Views', value: reel.shares ? `${((reel.shares / Math.max(reel.views, 1)) * 100).toFixed(2)}%` : '—', sub: reel.shares ? `${formatNumber(reel.shares)} de ${formatNumber(reel.views)}` : 'No disponible', note: 'compartidos sobre reproducciones' },
            { label: 'Likes / Views', value: `${reel.like_rate.toFixed(2)}%`, sub: `${formatNumber(reel.likes)} de ${formatNumber(reel.views)}`, note: 'likes sobre reproducciones' },
            { label: 'Comments / Views', value: `${reel.comment_rate.toFixed(2)}%`, sub: `${formatNumber(reel.comments)} de ${formatNumber(reel.views)}`, note: 'comentarios sobre reproducciones' },
          ].map(r => (
            <div key={r.label} className="detail-ratio-row">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{r.label}</span>
                <span className="stat-tile-value" style={{ fontSize: 16 }}>{r.value}</span>
              </div>
              <div className="stat-tile-sub" style={{ fontSize: 11, marginTop: 2 }}>{r.sub} — {r.note}</div>
            </div>
          ))}
        </Card>

        <Card>
          <div className="detail-label" style={{ marginBottom: 12 }}>Transcripción & Estructura</div>
          {reel.hook && (
            <div className="detail-highlight" style={{ marginBottom: 10 }}>
              <div className="detail-highlight-label">HOOK</div>
              <p style={{ fontSize: 12, color: 'var(--primary-dark)', lineHeight: 1.5 }}>{reel.hook}</p>
            </div>
          )}
          {reel.cta && (
            <div className="cta-highlight" style={{ marginBottom: 10 }}>
              <div className="cta-highlight-label">CTA</div>
              <p className="cta-highlight-text">{reel.cta}</p>
            </div>
          )}
          {reel.words_per_minute && (
            <div className="detail-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', marginBottom: 10 }}>
              <span className="detail-sublabel">Velocidad de habla</span>
              <span style={{ fontSize: 14, fontWeight: 700 }}>{reel.words_per_minute} wpm</span>
            </div>
          )}
          {reel.transcript ? (
            <div className="transcript-scroll">
              {reel.transcript.slice(0, 600)}{reel.transcript.length > 600 ? '...' : ''}
            </div>
          ) : (
            <p className="detail-sublabel" style={{ fontStyle: 'italic' }}>Sin transcripción disponible</p>
          )}
        </Card>
      </div>

      {totalSales > 0 && (
        <Card style={{ marginTop: 16 }}>
          <div className="detail-label" style={{ marginBottom: 4 }}>Ventas atribuidas</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{formatCurrency(totalSales)}</div>
        </Card>
      )}

      <div style={{ marginTop: 16 }}>
        <TrackingLinkCard reelId={reel.id} />
      </div>

      <div style={{ marginTop: 20 }}>
        <ReelDetailClient reelId={reel.id} existingAnalysis={reel.ai_analysis || ''} />
      </div>
    </div>
  )
}
