'use client'
import { useState } from 'react'
import Link from 'next/link'
import { formatNumber } from '@/lib/utils'
import type { Reel } from '@/types'
import ReelsChart from './ReelsChart'

type SortKey = 'timestamp' | 'views' | 'multiplier' | 'like_rate'
type FilterType = 'all' | 'reel' | 'trial'

function MultiplierBadge({ m }: { m: number }) {
  const cls = m >= 2 ? 'badge-up' : m >= 0.7 ? 'badge-avg' : 'badge-down'
  return <span className={`badge-multiplier ${cls}`}>×{m.toFixed(1)}</span>
}

export default function ReelsGrid({ reels, averages, totalLikes, totalViews }: {
  reels: Reel[]
  averages: any
  totalLikes: number
  totalViews: number
}) {
  const [sort, setSort] = useState<SortKey>('timestamp')
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc')
  const [filterType, setFilterType] = useState<FilterType>('all')

  let filtered = reels
  if (filterType === 'reel') filtered = filtered.filter(r => !r.is_trial)
  if (filterType === 'trial') filtered = filtered.filter(r => r.is_trial)

  const sorted = [...filtered].sort((a, b) => {
    const v = (x: Reel) => sort === 'timestamp' ? new Date(x.timestamp).getTime() : (x as any)[sort]
    return sortDir === 'desc' ? v(b) - v(a) : v(a) - v(b)
  })

  const toggleSort = (key: SortKey) => {
    if (sort === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    else { setSort(key); setSortDir('desc') }
  }

  return (
    <div className="grid-reels-main">
      {/* Left — reels list */}
      <div>
        {/* Filters bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-muted)' }}>
            Ordenar por
            <select value={sort} onChange={e => setSort(e.target.value as SortKey)} style={{ fontSize: 12, padding: '5px 10px', borderRadius: 6 }} aria-label="Ordenar reels por">
              <option value="timestamp">Fecha</option>
              <option value="views">Vistas</option>
              <option value="multiplier">Multiplicador</option>
              <option value="like_rate">Tasa likes</option>
            </select>
          </div>

          <button onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')} className="btn btn-ghost" style={{ padding: '5px 12px', fontSize: 12 }}>
            {sortDir === 'desc' ? '↓ Mayor → Menor' : '↑ Menor → Mayor'}
          </button>

          <div style={{ display: 'flex', gap: 4 }}>
            {(['all', 'reel', 'trial'] as FilterType[]).map(t => (
              <button key={t} onClick={() => setFilterType(t)} className={`pill ${filterType === t ? 'pill-active' : 'pill-inactive'}`} style={{ fontSize: 12 }}>
                {t === 'all' ? 'Todos' : t === 'reel' ? 'Reel' : 'Trial reel'}
              </button>
            ))}
          </div>

          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
            {sorted.length} de {reels.length}
          </span>
        </div>

        {/* Reels grid */}
        <div className="grid-reels">
          {sorted.map(reel => (
            <Link key={reel.id} href={`/reels/${reel.id}`} style={{ display: 'block' }}>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', transition: 'box-shadow 0.15s', cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = 'var(--shadow)')}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>
                {/* Thumbnail */}
                <div style={{ position: 'relative', paddingBottom: '160%', background: 'var(--surface-2)', overflow: 'hidden' }}>
                  {reel.thumbnail_url && (
                    <img src={`/api/proxy-image?url=${encodeURIComponent(reel.thumbnail_url)}`} alt={reel.caption?.split('\n')[0]?.slice(0, 80) || 'Miniatura del reel'} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                  )}
                  <div style={{ position: 'absolute', top: 6, left: 6 }}>
                    <MultiplierBadge m={reel.multiplier} />
                  </div>
                  {reel.duration_seconds && (
                    <div style={{ position: 'absolute', bottom: 6, left: 6, background: 'rgba(0,0,0,0.65)', color: 'white', fontSize: 11, fontWeight: 600, padding: '2px 6px', borderRadius: 4 }}>
                      ⏱ {Math.floor(reel.duration_seconds / 60)}:{String(reel.duration_seconds % 60).padStart(2, '0')}
                    </div>
                  )}
                  <div style={{ position: 'absolute', bottom: 6, right: 6, background: 'rgba(0,0,0,0.5)', color: 'white', fontSize: 10, padding: '2px 6px', borderRadius: 4 }}>
                    {new Date(reel.timestamp).toLocaleDateString('es', { day: 'numeric', month: 'short' })}
                  </div>
                </div>

                {/* Stats */}
                <div style={{ padding: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6, fontSize: 12, fontWeight: 600 }}>
                    <span>👁 {formatNumber(reel.views)}</span>
                    <span style={{ color: 'var(--text-muted)' }}>♥ {formatNumber(reel.likes)}</span>
                    <span style={{ color: 'var(--text-muted)' }}>💬 {formatNumber(reel.comments)}</span>
                  </div>
                  {reel.is_trial && (
                    <span style={{ fontSize: 10, background: 'var(--accent-light)', color: 'var(--accent)', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>Trial Reel</span>
                  )}
                  <p style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {reel.caption || 'Sin descripción'}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Right — summary panel */}
      <div style={{ position: 'sticky', top: 0 }}>
        <div className="card" style={{ padding: 20, marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: 12 }}>RESUMEN {reels.length} REELS</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'Views totales', value: formatNumber(totalViews), color: '#f59e0b' },
              { label: 'Likes totales', value: formatNumber(totalLikes), color: '#7c3aed' },
              { label: 'Comentarios totales', value: formatNumber(reels.reduce((s, r) => s + r.comments, 0)), color: '#2563eb' },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color }} />
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.label}</span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700 }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: 12 }}>TUS PROMEDIOS</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: 'Like rate', value: `${averages.avg_like_rate.toFixed(2)}%` },
              { label: 'Comment rate', value: `${averages.avg_comment_rate.toFixed(2)}%` },
              { label: 'WPM óptimo', value: averages.avg_wpm ? `${Math.round(averages.avg_wpm)} wpm` : '—' },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.label}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
