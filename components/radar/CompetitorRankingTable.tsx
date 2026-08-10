'use client'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2 } from 'lucide-react'
import ProfileAvatar from '@/components/ProfileAvatar'
import Table, { type TableColumn } from '@/components/ui/Table'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import AddCompetitorForm from '@/components/competidores/AddCompetitorForm'
import CompetitorDetailModal from './CompetitorDetailModal'
import CTABadge from './CTABadge'
import { formatNumber } from '@/lib/utils'
import type { CTAType } from '@/lib/cta-classifier'
import type { Competitor, CompetitorReel } from '@/types'

export interface CompetitorRow {
  competitor: Competitor
  reels: CompetitorReel[]
  totalComments: number
  totalViews: number
  engagement: number
  lastDate: string | null
  lastCtaType: CTAType
}

export default function CompetitorRankingTable({ rows, accountId }: { rows: CompetitorRow[]; accountId: string }) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [detail, setDetail] = useState<CompetitorRow | null>(null)
  const [removing, setRemoving] = useState<CompetitorRow | null>(null)
  const [removeError, setRemoveError] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((r) => r.competitor.ig_username.toLowerCase().includes(q))
  }, [rows, search])

  const remove = async () => {
    if (!removing) return
    setRemoveError('')
    try {
      const res = await fetch('/api/competitors/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ competitorId: removing.competitor.id }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setRemoveError(data.error || 'Error al eliminar')
        return
      }
      setRemoving(null)
      router.refresh()
    } catch {
      setRemoveError('Error de conexión')
    }
  }

  const columns: TableColumn<CompetitorRow>[] = [
    {
      key: 'rank',
      header: '#',
      width: '36px',
      render: (row) => <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-faint)' }}>{filtered.indexOf(row) + 1}</span>,
    },
    {
      key: 'cuenta',
      header: 'Cuenta',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ProfileAvatar accountId={row.competitor.id} type="competitor" username={row.competitor.ig_username} size={28} />
          <span style={{ fontWeight: 600, color: 'var(--text)' }}>@{row.competitor.ig_username}</span>
        </div>
      ),
    },
    { key: 'cta', header: 'CTA Tipo', render: (row) => <CTABadge type={row.lastCtaType} /> },
    { key: 'comments', header: 'Comentarios', accessor: (row) => row.totalComments, sortable: true, align: 'right', render: (row) => formatNumber(row.totalComments) },
    { key: 'views', header: 'Views', accessor: (row) => row.totalViews, sortable: true, align: 'right', render: (row) => formatNumber(row.totalViews) },
    { key: 'engagement', header: 'Engagement', accessor: (row) => row.engagement, sortable: true, align: 'right', render: (row) => `${row.engagement.toFixed(1)}%` },
    {
      key: 'fecha',
      header: 'Fecha',
      accessor: (row) => (row.lastDate ? new Date(row.lastDate).getTime() : 0),
      sortable: true,
      align: 'right',
      render: (row) => (row.lastDate ? new Date(row.lastDate).toLocaleDateString('es', { day: 'numeric', month: 'short' }) : '—'),
    },
    {
      key: 'actions',
      header: '',
      width: '40px',
      render: (row) => (
        <button
          onClick={(e) => {
            e.stopPropagation()
            setRemoving(row)
          }}
          className="topbar-icon-btn"
          aria-label={`Eliminar @${row.competitor.ig_username}`}
          title="Eliminar competidor"
        >
          <Trash2 size={15} />
        </button>
      ),
    },
  ]

  return (
    <div>
      <div className="filter-bar">
        <div style={{ position: 'relative', flex: 1, minWidth: 160, maxWidth: 280 }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por username..."
            style={{ width: '100%' }}
            aria-label="Buscar competidores"
          />
        </div>
        <span className="filter-bar-count">{filtered.length} de {rows.length}</span>
        <Button variant="primary" size="sm" leftIcon={Plus} onClick={() => setShowAdd(true)} style={{ marginLeft: 'auto' }}>
          Agregar
        </Button>
      </div>

      {filtered.length === 0 ? (
        <div className="card empty-state">
          <p className="empty-state-title">Sin competidores todavía</p>
          <p className="empty-state-desc">Agregá el @ de un creador de tu nicho para trackear sus reels</p>
        </div>
      ) : (
        <Table columns={columns} data={filtered} rowKey={(r) => r.competitor.id} onRowClick={(row) => setDetail(row)} />
      )}

      {showAdd && (
        <Modal title="Agregar competidor" onClose={() => setShowAdd(false)} maxWidth={480}>
          <AddCompetitorForm accountId={accountId} />
        </Modal>
      )}

      {detail && (
        <CompetitorDetailModal competitor={detail.competitor} reels={detail.reels} onClose={() => setDetail(null)} />
      )}

      {removing && (
        <Modal title="Eliminar competidor" onClose={() => setRemoving(null)} maxWidth={400}>
          <p style={{ fontSize: 13, color: 'var(--text)', marginBottom: 16 }}>
            ¿Seguro que querés dejar de trackear a <strong>@{removing.competitor.ig_username}</strong>? Se van a borrar todos sus reels sincronizados.
          </p>
          {removeError && <p style={{ fontSize: 12, color: 'var(--danger)', marginBottom: 12 }}>{removeError}</p>}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button variant="secondary" size="sm" onClick={() => setRemoving(null)}>Cancelar</Button>
            <Button variant="danger" size="sm" onClick={remove}>Eliminar</Button>
          </div>
        </Modal>
      )}
    </div>
  )
}
