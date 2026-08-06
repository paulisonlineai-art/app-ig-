import { cookies } from 'next/headers'
import { createServerSupabase } from '@/lib/supabase'
import { formatCurrency } from '@/lib/utils'
import AddSaleForm from '@/components/ventas/AddSaleForm'
import MonetizationMap from '@/components/ventas/MonetizationMap'
import type { Sale } from '@/types'

interface SaleWithReel extends Sale {
  reels: {
    caption: string | null
    thumbnail_url: string | null
    permalink: string | null
    views: number
    multiplier: number
    hook: string | null
    save_rate: number | null
    structure: { narrative_type?: string } | null
  } | null
}

export default async function VentasPage() {
  const cookieStore = await cookies()
  const accountId = cookieStore.get('ig_account_id')?.value!

  const db = createServerSupabase()
  const [{ data: sales }, { data: reels }] = await Promise.all([
    db.from('sales').select('*, reels(caption, thumbnail_url, permalink, views, multiplier, hook, save_rate, structure)').eq('account_id', accountId).order('closed_at', { ascending: false }).limit(200),
    db.from('reels').select('id, caption, thumbnail_url').eq('account_id', accountId).order('timestamp', { ascending: false }).limit(50),
  ])

  const allSales = (sales || []) as SaleWithReel[]
  const totalRevenue = allSales.reduce((s, r) => s + r.amount, 0)
  const totalCash = allSales.reduce((s, r) => s + r.cash_collected, 0)
  const totalPending = allSales.reduce((s, r) => s + r.pending_amount, 0)

  const SOURCE_LABELS: Record<string, string> = {
    stripe: '💳 Stripe',
    hotmart: '🔶 Hotmart',
    skool: '🟢 Skool',
  }

  return (
    <div>
      <h1 className="dash-greeting">Ventas</h1>
      <p className="dash-subtitle" style={{ marginBottom: 32 }}>
        Atribuí cada venta a una pieza de contenido específica
      </p>

      <div className="grid-stats-3" style={{ marginBottom: 32 }}>
        {[
          { label: 'Facturación total', value: formatCurrency(totalRevenue), icon: '💰' },
          { label: 'Cash cobrado', value: formatCurrency(totalCash), icon: '✅' },
          { label: 'Pendiente de cobro', value: formatCurrency(totalPending), icon: '⏳' },
        ].map(s => (
          <div key={s.label} className="kpi-card">
            <div className="kpi-icon">{s.icon}</div>
            <div className="kpi-value kpi-value-sm">{s.value}</div>
            <div className="kpi-label" style={{ marginBottom: 0, marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <MonetizationMap
        sales={allSales.map(s => ({
          amount: s.amount,
          closed_at: s.closed_at,
          source: s.source,
          reel_caption: s.reels?.caption || null,
          reel_views: s.reels?.views || null,
          reel_multiplier: s.reels?.multiplier || null,
          reel_hook: s.reels?.hook || null,
          reel_narrative_type: s.reels?.structure?.narrative_type || null,
          reel_save_rate: s.reels?.save_rate || null,
        }))}
        totalRevenue={totalRevenue}
      />

      <div className="card" style={{ padding: 24, marginBottom: 32 }}>
        <h2 className="section-title" style={{ marginBottom: 20 }}>Cargar nueva venta</h2>
        <AddSaleForm accountId={accountId} reels={reels || []} />
      </div>

      <div>
        <h2 className="section-title">Historial de ventas</h2>
        {allSales.length ? (
          <div className="sale-list">
            {allSales.map(sale => (
              <div key={sale.id} className="sale-item">
                {sale.reels?.thumbnail_url && (
                  <img
                    src={`/api/proxy-image?url=${encodeURIComponent(sale.reels.thumbnail_url)}`}
                    alt="Reel asociado a la venta"
                    className="sale-thumb"
                  />
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontWeight: 600 }}>{formatCurrency(sale.amount)}</span>
                    <span className={`sale-source-badge ${sale.source === 'manual' || !sale.source ? 'sale-source-manual' : 'sale-source-auto'}`}>
                      {SOURCE_LABELS[sale.source] || '✋ Manual'}
                    </span>
                  </div>
                  <div className="dash-subtitle">
                    {sale.installments} cuota{sale.installments > 1 ? 's' : ''} de {formatCurrency(sale.amount_per_installment)}
                  </div>
                  {sale.reels?.caption && (
                    <div className="dash-subtitle" style={{ marginTop: 4, fontSize: 12 }}>
                      📹 {sale.reels.caption.slice(0, 60)}...
                    </div>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 12, color: 'var(--success)', fontWeight: 600 }}>
                    Cobrado: {formatCurrency(sale.cash_collected)}
                  </div>
                  <div className="dash-subtitle" style={{ fontSize: 12 }}>
                    {new Date(sale.closed_at).toLocaleDateString('es')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card empty-state">
            <div className="empty-state-icon">💸</div>
            <p className="empty-state-title">No hay ventas registradas todavía</p>
            <p className="empty-state-desc">
              Cargá una arriba a mano, o configurá Stripe/Hotmart/Skool en <a href="/configuracion" style={{ color: 'var(--accent)', fontWeight: 600 }}>Settings</a> para que entren solas.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
