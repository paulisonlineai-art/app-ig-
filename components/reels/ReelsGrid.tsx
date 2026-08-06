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

interface Props {
  reels: Reel[]
  averages: { avg_like_rate: number; avg_comment_rate: number; avg_wpm: number }
  totalLikes: number
  totalViews: number
}

export default function ReelsGrid({ reels, averages, totalLikes, totalViews }: Props) {
  const [sort, setSort] = useState<SortKey>('timestamp')
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc')
  const [filterType, setFilterType] = useState<FilterType>('all')

  let filtered = reels
  if (filterType === 'reel') filtered = filtered.filter(r => !r.is_trial)
  if (filterType === 'trial') filtered = filtered.filter(r => r.is_trial)

  const sorted = [...filtered].sort((a, b) => {
    const v = (x: Reel) => sort === 'timestamp' ? new Date(x.timestamp).getTime() : x[sort]
    return sortDir === 'desc' ? v(b) - v(a) : v(a) - v(b)
  })

  const toggleSort = () => setSortDir(d => d === 'desc' ? 'asc' : 'desc')

  const totalComments = reels.reduce((s, r) => s + r.comments, 0)

  return (
    <div className="grid-reels-main">
      <div>
        {/* Filters bar */}
        <div className="filter-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-muted)' }}>
            Ordenar por
            <select
              value={sort}
              onChange={e => setSort(e.target.value as SortKey)}
              className="btn btn-ghost"
              style={{ padding: '5px 10px', fontSize: 12, appearance: 'auto' }}
              aria-label="Ordenar reels por"
            >
              <option value="timestamp">Fecha</option>
              <option value="views">Vistas</option>
              <option value="multiplier">Multiplicador</option>
              <option value="like_rate">Tasa likes</option>
            </select>
          </div>

          <button onClick={toggleSort} className="btn btn-ghost" style={{ padding: '5px 12px', fontSize: 12 }}>
            {sortDir === 'desc' ? '↓ Mayor → Menor' : '↑ Menor → Mayor'}
          </button>

          <div style={{ display: 'flex', gap: 4 }}>
            {(['all', 'reel', 'trial'] as FilterType[]).map(t => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`pill ${filterType === t ? 'pill-active' : 'pill-inactive'}`}
                style={{ fontSize: 12 }}
              >
                {t === 'all' ? 'Todos' : t === 'reel' ? 'Reel' : 'Trial reel'}
              </button>
            ))}
          </div>

          <span className="filter-bar-count">
            {sorted.length} de {reels.length}
          </span>
        </div>

        {/* Reels grid */}
        <div className="grid-reels">
          {sorted.map(reel => (
            <Link key={reel.id} href={`/reels/${reel.id}`} style={{ display: 'block' }}>
              <div className="reel-card">
                <div className="reel-thumb">
                  {reel.thumbnail_url && (
                    <img
                      src={`/api/proxy-image?url=${encodeURIComponent(reel.thumbnail_url)}`}
                      alt={reel.caption?.split('\n')[0]?.slice(0, 80) || 'Miniatura del reel'}
                    />
                  )}
                  <div className="video-overlay-tl">
                    <MultiplierBadge m={reel.multiplier} />
                  </div>
                  {reel.duration_seconds && (
                    <div className="reel-thumb-overlay reel-thumb-duration">
                      ⏱ {Math.floor(reel.duration_seconds / 60)}:{String(reel.duration_seconds % 60).padStart(2, '0')}
                    </div>
                  )}
                  <div className="reel-thumb-overlay reel-thumb-date">
                    {new Date(reel.timestamp).toLocaleDateString('es', { day: 'numeric', month: 'short' })}
                  </div>
                </div>

                <div className="reel-stats">
                  <div className="reel-stats-row">
                    <span>👁 {formatNumber(reel.views)}</span>
                    <span style={{ color: 'var(--text-muted)' }}>♥ {formatNumber(reel.likes)}</span>
                    <span style={{ color: 'var(--text-muted)' }}>💬 {formatNumber(reel.comments)}</span>
                  </div>
                  {reel.is_trial && <span className="reel-trial-badge">Trial Reel</span>}
                  <p className="reel-caption">{reel.caption || 'Sin descripción'}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Right — summary panel */}
      <div className="summary-panel">
        <div className="kpi-card" style={{ padding: 20, marginBottom: 16 }}>
          <div className="summary-section-title">RESUMEN {reels.length} REELS</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'Views totales', value: formatNumber(totalViews), color: '#f59e0b' },
              { label: 'Likes totales', value: formatNumber(totalLikes), color: '#7c3aed' },
              { label: 'Comentarios totales', value: formatNumber(totalComments), color: '#2563eb' },
            ].map(s => (
              <div key={s.label} className="summary-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div className="summary-dot" style={{ background: s.color }} />
                  <span className="summary-label">{s.label}</span>
                </div>
                <span className="summary-value">{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="kpi-card" style={{ padding: 20 }}>
          <div className="summary-section-title">TUS PROMEDIOS</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: 'Like rate', value: `${averages.avg_like_rate.toFixed(2)}%` },
              { label: 'Comment rate', value: `${averages.avg_comment_rate.toFixed(2)}%` },
              { label: 'WPM óptimo', value: averages.avg_wpm ? `${Math.round(averages.avg_wpm)} wpm` : '—' },
            ].map(s => (
              <div key={s.label} className="detail-row" style={{ borderBottom: 'none', marginBottom: 0, paddingBottom: 0 }}>
                <span className="summary-label">{s.label}</span>
                <span className="summary-value summary-value-accent">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
