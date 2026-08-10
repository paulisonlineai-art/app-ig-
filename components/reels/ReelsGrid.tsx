'use client'
import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, Heart, MessageCircle, Bookmark, LayoutGrid, List as ListIcon, Search } from 'lucide-react'
import { formatNumber } from '@/lib/utils'
import type { Reel } from '@/types'
import Table, { type TableColumn } from '@/components/ui/Table'
import ReelsChart from './ReelsChart'

type SortKey = 'views' | 'timestamp' | 'engagement'
type ViewMode = 'grid' | 'list'

const PAGE_SIZE = 24

function engagementRate(r: Reel): number {
  if (!r.views) return 0
  return ((r.likes + r.comments + r.shares + r.saves) / r.views) * 100
}

export default function ReelsGrid({ reels }: { reels: Reel[] }) {
  const [sortKey, setSortKey] = useState<SortKey>('timestamp')
  const [search, setSearch] = useState('')
  const [view, setView] = useState<ViewMode>('grid')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const router = useRouter()

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return reels
    return reels.filter((r) => (r.caption || '').toLowerCase().includes(q))
  }, [reels, search])

  const sorted = useMemo(() => {
    const withScore = filtered.map((r) => ({ r, score: sortKey === 'engagement' ? engagementRate(r) : sortKey === 'views' ? r.views : new Date(r.timestamp).getTime() }))
    withScore.sort((a, b) => b.score - a.score)
    return withScore.map((x) => x.r)
  }, [filtered, sortKey])

  const visible = sorted.slice(0, visibleCount)

  const columns: TableColumn<Reel>[] = [
    {
      key: 'thumbnail',
      header: '',
      width: '48px',
      render: (r) => (
        <div style={{ width: 32, height: 32, borderRadius: 6, overflow: 'hidden', background: 'var(--surface-2)', flexShrink: 0 }}>
          {r.thumbnail_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`/api/proxy-image?url=${encodeURIComponent(r.thumbnail_url)}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          )}
        </div>
      ),
    },
    {
      key: 'caption',
      header: 'Caption',
      render: (r) => (
        <span style={{ display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden', maxWidth: 280 }}>
          {r.caption || '—'}
        </span>
      ),
    },
    { key: 'views', header: 'Vistas', accessor: (r) => r.views, sortable: true, align: 'right', render: (r) => formatNumber(r.views) },
    { key: 'likes', header: 'Likes', accessor: (r) => r.likes, sortable: true, align: 'right', render: (r) => formatNumber(r.likes) },
    { key: 'comments', header: 'Comentarios', accessor: (r) => r.comments, sortable: true, align: 'right', render: (r) => formatNumber(r.comments) },
    { key: 'saves', header: 'Guardados', accessor: (r) => r.saves, sortable: true, align: 'right', render: (r) => formatNumber(r.saves) },
    { key: 'shares', header: 'Compartidos', accessor: (r) => r.shares, sortable: true, align: 'right', render: (r) => formatNumber(r.shares) },
    { key: 'engagement', header: 'Engagement', accessor: (r) => engagementRate(r), sortable: true, align: 'right', render: (r) => `${engagementRate(r).toFixed(1)}%` },
    {
      key: 'fecha',
      header: 'Fecha',
      accessor: (r) => new Date(r.timestamp).getTime(),
      sortable: true,
      align: 'right',
      render: (r) => new Date(r.timestamp).toLocaleDateString('es', { day: 'numeric', month: 'short' }),
    },
  ]

  return (
    <div>
      {reels.length > 1 && (
        <div className="card" style={{ padding: '16px 12px 8px', marginBottom: 16 }}>
          <ReelsChart reels={reels} />
        </div>
      )}

      {/* Filter bar */}
      <div className="filter-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-muted)' }}>
          Ordenar por
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="btn btn-ghost"
            style={{ padding: '5px 10px', fontSize: 12, appearance: 'auto' }}
            aria-label="Ordenar reels por"
          >
            <option value="views">Más vistas</option>
            <option value="timestamp">Más recientes</option>
            <option value="engagement">Mejor engagement</option>
          </select>
        </div>

        <div style={{ position: 'relative', flex: 1, minWidth: 160, maxWidth: 280 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)' }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por caption..."
            style={{ width: '100%', paddingLeft: 32 }}
            aria-label="Buscar reels por caption"
          />
        </div>

        <div className="period-toggle" role="group" aria-label="Vista">
          <button
            onClick={() => setView('grid')}
            className={`period-toggle-btn${view === 'grid' ? ' active' : ''}`}
            aria-label="Vista de grilla"
            style={{ display: 'flex', alignItems: 'center' }}
          >
            <LayoutGrid size={14} />
          </button>
          <button
            onClick={() => setView('list')}
            className={`period-toggle-btn${view === 'list' ? ' active' : ''}`}
            aria-label="Vista de lista"
            style={{ display: 'flex', alignItems: 'center' }}
          >
            <ListIcon size={14} />
          </button>
        </div>

        <span className="filter-bar-count">
          {sorted.length} de {reels.length}
        </span>
      </div>

      {sorted.length === 0 ? (
        <div className="card empty-state">
          <p className="empty-state-title">Sin resultados</p>
          <p className="empty-state-desc">Probá con otra búsqueda o filtro.</p>
        </div>
      ) : view === 'grid' ? (
        <>
          <div className="reels-grid-v2">
            {visible.map((reel) => (
              <Link key={reel.id} href={`/reels/${reel.id}`} className="reel-card-v2">
                <div className="reel-card-v2-thumb">
                  {reel.thumbnail_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`/api/proxy-image?url=${encodeURIComponent(reel.thumbnail_url)}`}
                      alt={reel.caption?.split('\n')[0]?.slice(0, 80) || 'Miniatura del reel'}
                    />
                  )}
                  <div className="reel-thumb-overlay reel-thumb-date">
                    {new Date(reel.timestamp).toLocaleDateString('es', { day: 'numeric', month: 'short' })}
                  </div>
                </div>
                <div className="reel-card-v2-body">
                  <p className="reel-card-v2-caption">{reel.caption || 'Sin descripción'}</p>
                  <div className="reel-card-v2-metrics">
                    <span><Eye size={13} strokeWidth={1.75} /> {formatNumber(reel.views)}</span>
                    <span><Heart size={13} strokeWidth={1.75} /> {formatNumber(reel.likes)}</span>
                    <span><MessageCircle size={13} strokeWidth={1.75} /> {formatNumber(reel.comments)}</span>
                    <span><Bookmark size={13} strokeWidth={1.75} /> {formatNumber(reel.saves)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          {visibleCount < sorted.length && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20 }}>
              <button className="btn btn-ghost" onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}>
                Cargar más ({sorted.length - visibleCount} restantes)
              </button>
            </div>
          )}
        </>
      ) : (
        <>
          <Table columns={columns} data={visible} rowKey={(r) => r.id} onRowClick={(r) => router.push(`/reels/${r.id}`)} />
          {visibleCount < sorted.length && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20 }}>
              <button className="btn btn-ghost" onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}>
                Cargar más ({sorted.length - visibleCount} restantes)
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
