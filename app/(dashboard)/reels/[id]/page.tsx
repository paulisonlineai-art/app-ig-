import { cookies } from 'next/headers'
import { createServerSupabase } from '@/lib/supabase'
import { formatNumber, formatCurrency, calcAverages } from '@/lib/utils'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import ReelDetailClient from '@/components/reels/detail/ReelDetailClient'
import BenchmarkChart from '@/components/reels/detail/BenchmarkChart'
import TrackingLinkCard from '@/components/reels/detail/TrackingLinkCard'

function DeltaBadge({ actual, benchmark }: { actual: number; benchmark: number }) {
  if (!benchmark) return null
  const pct = ((actual - benchmark) / benchmark) * 100
  const up = pct >= 0
  return (
    <div style={{ marginTop: 4, fontSize: 11, fontWeight: 600, color: up ? 'var(--success)' : 'var(--danger)' }}>
      {up ? '↑' : '↓'} {Math.abs(pct).toFixed(0)}% más {up ? 'alto' : 'bajo'}
    </div>
  )
}

export default async function ReelDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cookieStore = await cookies()
  const accountId = cookieStore.get('ig_account_id')?.value!

  const db = createServerSupabase()
  const [{ data: reel }, { data: allReels }, { data: sales }] = await Promise.all([
    db.from('reels').select('*').eq('id', id).eq('account_id', accountId).single(),
    db.from('reels').select('views,like_rate,comment_rate,words_per_minute,timestamp').eq('account_id', accountId),
    db.from('sales').select('amount,cash_collected').eq('account_id', accountId).eq('reel_id', id),
  ])

  if (!reel) notFound()

  const avgs = calcAverages(allReels || [])
  const totalSales = (sales || []).reduce((s: number, x: { amount: number }) => s + x.amount, 0)

  const dayViews: Record<number, number[]> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] }
  for (const r of allReels || []) {
    const day = new Date(r.timestamp).getDay()
    dayViews[day].push(r.views)
  }
  const dayAvg = Object.entries(dayViews).map(([d, vs]) => ({
    day: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][+d],
    avg: vs.length ? vs.reduce((a, b) => a + b, 0) / vs.length : 0,
  }))

  const reelDay = new Date(reel.timestamp).getDay()
  const bestDay = dayAvg.reduce((best, d) => d.avg > best.avg ? d : best, dayAvg[0])

  return (
    <div>
      <Link href="/reels" className="warning-link" style={{ marginBottom: 20, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        ← Volver a Reels
      </Link>

      <div className="grid-detail">
        {/* Left — video preview */}
        <div>
          <div className="video-preview">
            {reel.thumbnail_url && (
              <img src={`/api/proxy-image?url=${encodeURIComponent(reel.thumbnail_url)}`} alt={reel.caption?.split('\n')[0]?.slice(0, 80) || 'Miniatura del reel'} className="video-preview-img" />
            )}
            <div className="video-overlay-tl">
              <span className={`badge-multiplier ${reel.multiplier >= 2 ? 'badge-up' : reel.multiplier >= 0.7 ? 'badge-avg' : 'badge-down'}`}>
                ×{reel.multiplier.toFixed(1)}
              </span>
            </div>
            {reel.duration_seconds && (
              <div className="video-overlay-tr">
                ⏱ {Math.floor(reel.duration_seconds / 60)}:{String(reel.duration_seconds % 60).padStart(2, '0')}
              </div>
            )}
          </div>
          <a href={reel.permalink} target="_blank" rel="noopener noreferrer" className="btn btn-ghost" style={{ display: 'flex', justifyContent: 'center', marginTop: 10, fontSize: 13 }}>
            📱 Abrir en Instagram ↗
          </a>
        </div>

        {/* Right — metrics */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ padding: 20 }}>
            <h1 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 8, lineHeight: 1.3 }}>
              {reel.caption?.split('\n')[0] || 'Sin título'}
            </h1>
            {reel.caption && reel.caption.split('\n').length > 1 && (
              <p className="dash-subtitle" style={{ marginBottom: 10, lineHeight: 1.5 }}>
                {reel.caption.split('\n').slice(1).join(' ').slice(0, 140)}
              </p>
            )}
            <div className="detail-sublabel">
              Publicado el {new Date(reel.timestamp).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })}
              {reel.is_trial && <span className="pill pill-active" style={{ marginLeft: 8, fontSize: 11 }}>Trial Reel</span>}
            </div>
          </div>

          <div className="grid-stats-4">
            {[
              { label: 'Me gusta', value: formatNumber(reel.likes), rate: reel.like_rate, benchmark: avgs.avg_like_rate },
              { label: 'Comentarios', value: formatNumber(reel.comments), rate: reel.comment_rate, benchmark: avgs.avg_comment_rate },
              { label: 'Multiplicador', value: `×${reel.multiplier.toFixed(2)}`, rate: null, benchmark: null },
              { label: 'Ventas', value: totalSales > 0 ? formatCurrency(totalSales) : '—', rate: null, benchmark: null },
            ].map(m => (
              <div key={m.label} className="metric-card" style={{ padding: 14 }}>
                <div className="stat-tile-label" style={{ marginBottom: 6 }}>{m.label}</div>
                <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>{m.value}</div>
                {m.rate !== null && <div className="stat-tile-sub" style={{ fontSize: 11.5 }}>{m.rate!.toFixed(2)}% de vistas</div>}
                {m.benchmark !== null && <DeltaBadge actual={m.rate!} benchmark={m.benchmark!} />}
              </div>
            ))}
          </div>

          <div className="card grid-detail-bottom-6" style={{ padding: 16 }}>
            {[
              { label: 'VISTAS', value: formatNumber(reel.views) },
              { label: 'ALCANCE', value: formatNumber(reel.reach) },
              { label: 'ENGAGEMENT', value: `${((reel.likes + reel.comments + reel.shares + reel.saves) / Math.max(reel.views, 1) * 100).toFixed(1)}%` },
              { label: 'ORGÁNICO', value: `${reel.organic_percentage}%` },
              { label: 'WPM', value: reel.words_per_minute ? `${reel.words_per_minute}` : '—' },
              { label: 'MULTIPLICADOR', value: `×${reel.multiplier.toFixed(2)}` },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div className="stat-tile-label" style={{ letterSpacing: '0.06em', marginBottom: 4 }}>{s.label}</div>
                <div className="stat-tile-value" style={{ fontSize: 16 }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid-detail-charts-2" style={{ marginTop: 20 }}>
        <BenchmarkChart reel={reel} avgs={avgs} />

        <div className="card" style={{ padding: 20 }}>
          <div className="detail-label" style={{ marginBottom: 4 }}>VIEWS POR DÍA DE SEMANA</div>
          <div className="detail-sublabel" style={{ marginBottom: 16 }}>Distribución de views de tu cuenta</div>
          <div className="day-bar-chart">
            {dayAvg.map((d) => {
              const maxAvg = Math.max(...dayAvg.map(x => x.avg), 1)
              const isReel = dayAvg.indexOf(d) === reelDay
              const isBest = d.day === bestDay.day
              return (
                <div key={d.day} className="day-bar-col">
                  <div className="day-bar" style={{ background: isReel ? 'var(--accent)' : isBest ? 'var(--accent-light)' : 'var(--surface-2)', height: `${(d.avg / maxAvg) * 64}px`, border: isBest ? '1.5px solid var(--accent)' : undefined }} />
                  <div className="day-bar-label" style={{ color: isReel ? 'var(--accent)' : undefined, fontWeight: isReel ? 700 : undefined }}>{d.day}</div>
                </div>
              )
            })}
          </div>
          {bestDay && (
            <div className="detail-highlight" style={{ marginTop: 12, display: 'flex', gap: 6, fontSize: 12 }}>
              <span style={{ color: 'var(--accent)', fontWeight: 600 }}>📅 Día con más views: {bestDay.day}</span>
              <span style={{ color: 'var(--text-muted)' }}>— {formatNumber(Math.round(bestDay.avg))} views promedio</span>
            </div>
          )}
        </div>
      </div>

      {/* VS Benchmark + Ratios + Transcript */}
      <div className="grid-detail-3col" style={{ marginTop: 16 }}>
        <div className="card" style={{ padding: 20 }}>
          <div className="detail-label" style={{ marginBottom: 16 }}>VS BENCHMARK 90D</div>
          {[
            { label: 'Me gusta', actual: reel.likes, rate: reel.like_rate, bRate: avgs.avg_like_rate, color: '#7c3aed' },
            { label: 'Comentarios', actual: reel.comments, rate: reel.comment_rate, bRate: avgs.avg_comment_rate, color: '#f59e0b' },
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
        </div>

        <div className="card" style={{ padding: 20 }}>
          <div className="detail-label" style={{ marginBottom: 16 }}>RATIOS CLAVE</div>
          <p className="detail-sublabel" style={{ marginBottom: 12 }}>Proporciones con denominador real</p>
          {[
            { label: 'Interacciones / Views', value: `${((reel.likes + reel.comments + reel.shares + reel.saves) / Math.max(reel.views, 1) * 100).toFixed(2)}%`, sub: `${formatNumber(reel.likes + reel.comments + reel.shares + reel.saves)} de ${formatNumber(reel.views)}`, note: 'engagement bruto' },
            { label: 'Shares / Views', value: reel.shares ? `${((reel.shares / Math.max(reel.views,1)) * 100).toFixed(2)}%` : '—', sub: reel.shares ? `${formatNumber(reel.shares)} de ${formatNumber(reel.views)}` : 'No disponible vía scraping público', note: 'compartidos sobre reproducciones' },
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
        </div>

        <div className="card" style={{ padding: 20 }}>
          <div className="detail-label" style={{ marginBottom: 12 }}>TRANSCRIPCIÓN & ESTRUCTURA</div>
          {reel.hook && (
            <div className="detail-highlight" style={{ marginBottom: 10 }}>
              <div className="detail-highlight-label">HOOK</div>
              <p style={{ fontSize: 12, color: 'var(--accent-dark)', lineHeight: 1.5 }}>{reel.hook}</p>
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
              <span className="detail-sublabel">🗣 Velocidad de habla</span>
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
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <TrackingLinkCard reelId={reel.id} />
      </div>

      <div style={{ marginTop: 20 }}>
        <ReelDetailClient reelId={reel.id} existingAnalysis={reel.ai_analysis || ''} />
      </div>
    </div>
  )
}
