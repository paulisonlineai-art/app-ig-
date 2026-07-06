import { cookies } from 'next/headers'
import { createServerSupabase } from '@/lib/supabase'
import { formatNumber, formatCurrency, calcAverages } from '@/lib/utils'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import ReelDetailClient from '@/components/reels/detail/ReelDetailClient'
import BenchmarkChart from '@/components/reels/detail/BenchmarkChart'
import TrackingLinkCard from '@/components/reels/detail/TrackingLinkCard'

function DeltaBadge({ actual, benchmark, label }: { actual: number; benchmark: number; label: string }) {
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
    db.from('reels').select('views,like_rate,save_rate,comment_rate,share_rate,words_per_minute,timestamp').eq('account_id', accountId),
    db.from('sales').select('amount,cash_collected').eq('account_id', accountId).eq('reel_id', id),
  ])

  if (!reel) notFound()

  const avgs = calcAverages(allReels || [])
  const totalSales = (sales || []).reduce((s: number, x: any) => s + x.amount, 0)

  // Views by day of week (from all reels published on same day)
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
      {/* Back */}
      <Link href="/reels" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-muted)', fontWeight: 500, marginBottom: 20 }}>
        ← Volver a Reels
      </Link>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24, alignItems: 'start' }}>
        {/* Left — video preview */}
        <div>
          <div style={{ background: '#000', borderRadius: 16, overflow: 'hidden', position: 'relative', paddingBottom: '177%' }}>
            {reel.thumbnail_url && (
              <img src={`/api/proxy-image?url=${encodeURIComponent(reel.thumbnail_url)}`} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }} />
            )}
            <div style={{ position: 'absolute', top: 10, left: 10 }}>
              <span className={`badge-multiplier ${reel.multiplier >= 2 ? 'badge-up' : reel.multiplier >= 0.7 ? 'badge-avg' : 'badge-down'}`}>
                ×{reel.multiplier.toFixed(1)}
              </span>
            </div>
            {reel.duration_seconds && (
              <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.6)', color: 'white', fontSize: 12, fontWeight: 600, padding: '3px 8px', borderRadius: 6 }}>
                ⏱ {Math.floor(reel.duration_seconds / 60)}:{String(reel.duration_seconds % 60).padStart(2, '0')}
              </div>
            )}
          </div>
          <a href={reel.permalink} target="_blank" rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 10, padding: '9px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>
            📱 Abrir en Instagram ↗
          </a>
        </div>

        {/* Right — metrics */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Title + meta */}
          <div className="card" style={{ padding: 20 }}>
            <h1 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 8, lineHeight: 1.3 }}>
              {reel.caption?.split('\n')[0] || 'Sin título'}
            </h1>
            {reel.caption && reel.caption.split('\n').length > 1 && (
              <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 10 }}>
                {reel.caption.split('\n').slice(1).join(' ').slice(0, 140)}
              </p>
            )}
            <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>
              Publicado el {new Date(reel.timestamp).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })}
              {reel.is_trial && <span style={{ marginLeft: 8, background: 'var(--accent-light)', color: 'var(--accent)', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>Trial Reel</span>}
            </div>
          </div>

          {/* Key metrics row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
            {[
              { label: 'Me gusta', value: formatNumber(reel.likes), rate: reel.like_rate, benchmark: avgs.avg_like_rate, icon: '♥' },
              { label: 'Guardados', value: '—', rate: null, benchmark: null, icon: '🔖' },
              { label: 'Compartidos', value: '—', rate: null, benchmark: null, icon: '↗' },
              { label: 'Comentarios', value: formatNumber(reel.comments), rate: reel.comment_rate, benchmark: avgs.avg_comment_rate, icon: '💬' },
              { label: 'Ventas', value: totalSales > 0 ? formatCurrency(totalSales) : '—', rate: null, benchmark: null, icon: '$' },
            ].map(m => (
              <div key={m.label} className="metric-card" style={{ padding: 14 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.04em', marginBottom: 6, textTransform: 'uppercase' }}>{m.label}</div>
                <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>{m.value}</div>
                {m.rate !== null && <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>{m.rate!.toFixed(2)}% de vistas</div>}
                {m.benchmark !== null && <DeltaBadge actual={m.rate!} benchmark={m.benchmark!} label={m.label} />}
                {m.rate === null && m.value === '—' && <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 4 }}>Sin datos</div>}
              </div>
            ))}
          </div>

          {/* Bottom stats bar */}
          <div className="card" style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12 }}>
            {[
              { label: 'VISTAS', value: formatNumber(reel.views) },
              { label: 'ALCANCE', value: formatNumber(reel.reach) },
              { label: 'ENGAGEMENT', value: `${((reel.likes + reel.comments + reel.shares + reel.saves) / Math.max(reel.views, 1) * 100).toFixed(1)}%` },
              { label: 'ORGÁNICO', value: `${reel.organic_percentage}%` },
              { label: 'WPM', value: reel.words_per_minute ? `${reel.words_per_minute}` : '—' },
              { label: 'MULTIPLICADOR', value: `×${reel.multiplier.toFixed(2)}` },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.06em', marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--accent)' }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 20 }}>
        <BenchmarkChart reel={reel} avgs={avgs} />

        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: 4 }}>VIEWS POR DÍA DE SEMANA</div>
          <div style={{ fontSize: 11, color: 'var(--text-faint)', marginBottom: 16 }}>Distribución de views de tu cuenta</div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 80 }}>
            {dayAvg.map((d) => {
              const maxAvg = Math.max(...dayAvg.map(x => x.avg), 1)
              const isReel = dayAvg.indexOf(d) === reelDay
              const isBest = d.day === bestDay.day
              return (
                <div key={d.day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: '100%', background: isReel ? 'var(--accent)' : isBest ? 'var(--accent-light)' : 'var(--surface-2)', borderRadius: '4px 4px 0 0', height: `${(d.avg / maxAvg) * 64}px`, minHeight: 4, border: isBest ? '1.5px solid var(--accent)' : '1px solid var(--border)', transition: 'all 0.2s' }} />
                  <div style={{ fontSize: 10, color: isReel ? 'var(--accent)' : 'var(--text-muted)', fontWeight: isReel ? 700 : 500 }}>{d.day}</div>
                </div>
              )
            })}
          </div>
          {bestDay && (
            <div style={{ marginTop: 12, padding: '8px 12px', background: 'var(--accent-light)', borderRadius: 8, fontSize: 12 }}>
              <span style={{ color: 'var(--accent)', fontWeight: 600 }}>📅 Día con más views: {bestDay.day}</span>
              <span style={{ color: 'var(--text-muted)', marginLeft: 6 }}>— {formatNumber(Math.round(bestDay.avg))} views promedio</span>
            </div>
          )}
        </div>
      </div>

      {/* VS Benchmark + Ratios + Transcript */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginTop: 16 }}>
        {/* VS Benchmark 90d */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: 16 }}>VS BENCHMARK 90D</div>
          {[
            { label: 'Me gusta', actual: reel.likes, benchmark: avgs.avg_like_rate * reel.views / 100, rate: reel.like_rate, bRate: avgs.avg_like_rate, color: '#7c3aed' },
            { label: 'Comentarios', actual: reel.comments, benchmark: avgs.avg_comment_rate * reel.views / 100, rate: reel.comment_rate, bRate: avgs.avg_comment_rate, color: '#f59e0b' },
          ].map(m => {
            const pct = m.bRate > 0 ? ((m.rate - m.bRate) / m.bRate) * 100 : 0
            const up = pct >= 0
            return (
              <div key={m.label} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{m.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: up ? 'var(--success)' : 'var(--danger)' }}>
                    {formatNumber(m.actual)} <span style={{ fontWeight: 400 }}>({up ? '+' : ''}{pct.toFixed(0)}%)</span>
                  </span>
                </div>
                <div style={{ height: 4, background: 'var(--surface-2)', borderRadius: 2, position: 'relative' }}>
                  <div style={{ height: '100%', background: m.color, borderRadius: 2, width: `${Math.min(100, (m.rate / Math.max(m.bRate * 2, 0.01)) * 100)}%` }} />
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-faint)', marginTop: 2 }}>Benchmark: {m.bRate.toFixed(2)}%</div>
              </div>
            )
          })}
        </div>

        {/* Ratios clave */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: 16 }}>RATIOS CLAVE</div>
          <p style={{ fontSize: 11, color: 'var(--text-faint)', marginBottom: 12 }}>Proporciones con denominador real</p>
          {[
            { label: 'Interacciones / Views', value: `${((reel.likes + reel.comments + reel.shares + reel.saves) / Math.max(reel.views, 1) * 100).toFixed(2)}%`, sub: `${formatNumber(reel.likes + reel.comments + reel.shares + reel.saves)} de ${formatNumber(reel.views)}`, note: 'engagement bruto' },
            { label: 'Saves / Views', value: '—', sub: 'Instagram no expone este dato públicamente', note: 'guardados sobre reproducciones' },
            { label: 'Likes / Views', value: `${reel.like_rate.toFixed(2)}%`, sub: `${formatNumber(reel.likes)} de ${formatNumber(reel.views)}`, note: 'likes sobre reproducciones' },
            { label: 'Comments / Views', value: `${reel.comment_rate.toFixed(2)}%`, sub: `${formatNumber(reel.comments)} de ${formatNumber(reel.views)}`, note: 'comentarios sobre reproducciones' },
          ].map(r => (
            <div key={r.label} style={{ marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{r.label}</span>
                <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--accent)' }}>{r.value}</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{r.sub} — {r.note}</div>
            </div>
          ))}
        </div>

        {/* Transcript + hook */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: 12 }}>TRANSCRIPCIÓN & ESTRUCTURA</div>
          {reel.hook && (
            <div style={{ background: 'var(--accent-light)', borderRadius: 8, padding: 10, marginBottom: 10 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.06em', marginBottom: 4 }}>HOOK</div>
              <p style={{ fontSize: 12, color: 'var(--accent-dark)', lineHeight: 1.5 }}>{reel.hook}</p>
            </div>
          )}
          {reel.cta && (
            <div style={{ background: 'var(--success-bg)', borderRadius: 8, padding: 10, marginBottom: 10 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--success)', letterSpacing: '0.06em', marginBottom: 4 }}>CTA</div>
              <p style={{ fontSize: 12, color: 'var(--success)', lineHeight: 1.5 }}>{reel.cta}</p>
            </div>
          )}
          {reel.words_per_minute && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: 'var(--surface-2)', borderRadius: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>🗣 Velocidad de habla</span>
              <span style={{ fontSize: 14, fontWeight: 700 }}>{reel.words_per_minute} wpm</span>
            </div>
          )}
          {reel.transcript ? (
            <div style={{ maxHeight: 180, overflowY: 'auto', fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
              {reel.transcript.slice(0, 600)}{reel.transcript.length > 600 ? '...' : ''}
            </div>
          ) : (
            <p style={{ fontSize: 12, color: 'var(--text-faint)', fontStyle: 'italic' }}>Sin transcripción disponible</p>
          )}
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <TrackingLinkCard reelId={reel.id} />
      </div>

      {/* AI Analysis section — client component for interactivity */}
      <div style={{ marginTop: 20 }}>
        <ReelDetailClient reelId={reel.id} existingAnalysis={reel.ai_analysis || ''} />
      </div>
    </div>
  )
}
