'use client'
import { useRouter } from 'next/navigation'
import Table, { type TableColumn } from '@/components/ui/Table'
import { formatNumber } from '@/lib/utils'

export interface BestReel {
  id: string
  thumbnail_url: string | null
  caption: string | null
  views: number
  likes: number
  comments: number
  saves: number
  timestamp: string
}

export default function BestReelsTable({ reels }: { reels: BestReel[] }) {
  const router = useRouter()

  const columns: TableColumn<BestReel>[] = [
    {
      key: 'thumbnail',
      header: '',
      width: '56px',
      render: (r) => (
        <div style={{ width: 40, height: 40, borderRadius: 8, overflow: 'hidden', background: 'var(--surface-2)', flexShrink: 0 }}>
          {r.thumbnail_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={r.thumbnail_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          )}
        </div>
      ),
    },
    {
      key: 'caption',
      header: 'Caption',
      render: (r) => (
        <span
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 1,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            maxWidth: 320,
            color: 'var(--text)',
          }}
        >
          {r.caption || '—'}
        </span>
      ),
    },
    { key: 'views', header: 'Vistas', accessor: (r) => r.views, sortable: true, align: 'right', render: (r) => formatNumber(r.views) },
    { key: 'likes', header: 'Likes', accessor: (r) => r.likes, sortable: true, align: 'right', render: (r) => formatNumber(r.likes) },
    { key: 'comments', header: 'Comentarios', accessor: (r) => r.comments, sortable: true, align: 'right', render: (r) => formatNumber(r.comments) },
    { key: 'saves', header: 'Guardados', accessor: (r) => r.saves, sortable: true, align: 'right', render: (r) => formatNumber(r.saves) },
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
    <Table
      columns={columns}
      data={reels}
      rowKey={(r) => r.id}
      onRowClick={(r) => router.push(`/reels/${r.id}`)}
    />
  )
}
