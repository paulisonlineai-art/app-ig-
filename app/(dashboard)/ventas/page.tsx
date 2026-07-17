import { cookies } from 'next/headers'
import { createServerSupabase } from '@/lib/supabase'
import { formatCurrency } from '@/lib/utils'
import AddSaleForm from '@/components/ventas/AddSaleForm'
import MonetizationMap from '@/components/ventas/MonetizationMap'

export default async function VentasPage() {
  const cookieStore = await cookies()
  const accountId = cookieStore.get('ig_account_id')?.value!

  const db = createServerSupabase()
  const [{ data: sales }, { data: reels }] = await Promise.all([
    db.from('sales').select('*, reels(caption, thumbnail_url, permalink, views, multiplier, hook, save_rate, structure)').eq('account_id', accountId).order('closed_at', { ascending: false }).limit(200),
    db.from('reels').select('id, caption, thumbnail_url').eq('account_id', accountId).order('timestamp', { ascending: false }).limit(50),
  ])

  const allSales = sales || []
  const totalRevenue = allSales.reduce((s: number, r: any) => s + r.amount, 0)
  const totalCash = allSales.reduce((s: number, r: any) => s + r.cash_collected, 0)
  const totalPending = allSales.reduce((s: number, r: any) => s + r.pending_amount, 0)

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Ventas</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 32, fontSize: 14 }}>
        Atribuí cada venta a una pieza de contenido específica
      </p>

      {/* Stats */}
      <div className="grid-stats-3" style={{ marginBottom: 32 }}>
        {[
          { label: 'Facturación total', value: formatCurrency(totalRevenue), icon: '💰' },
          { label: 'Cash cobrado', value: formatCurrency(totalCash), icon: '✅' },
          { label: 'Pendiente de cobro', value: formatCurrency(totalPending), icon: '⏳' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20 }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Monetization Map */}
      <MonetizationMap
        sales={allSales.map((s: any) => ({
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

      {/* Add sale form */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, marginBottom: 32 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Cargar nueva venta</h2>
        <AddSaleForm accountId={accountId} reels={reels || []} />
      </div>

      {/* Sales list */}
      <div>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Historial de ventas</h2>
        {allSales.length ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {allSales.map((sale: any) => (
              <div key={sale.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
                {sale.reels?.thumbnail_url && (
                  <img src={`/api/proxy-image?url=${encodeURIComponent(sale.reels.thumbnail_url)}`} alt="Reel asociado a la venta" style={{ width: 48, height: 72, borderRadius: 8, objectFit: 'cover' }} />
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontWeight: 600 }}>{formatCurrency(sale.amount)}</span>
                    <span style={{
                      fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
                      background: sale.source === 'manual' || !sale.source ? 'var(--surface-2)' : 'var(--success-bg)',
                      color: sale.source === 'manual' || !sale.source ? 'var(--text-muted)' : 'var(--success)',
                    }}>
                      {{ stripe: '💳 Stripe', hotmart: '🔶 Hotmart', skool: '🟢 Skool' }[sale.source as string] || '✋ Manual'}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    {sale.installments} cuota{sale.installments > 1 ? 's' : ''} de {formatCurrency(sale.amount_per_installment)}
                  </div>
                  {sale.reels?.caption && (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                      📹 {sale.reels.caption.slice(0, 60)}...
                    </div>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 12, color: 'var(--success)', fontWeight: 600 }}>
                    Cobrado: {formatCurrency(sale.cash_collected)}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {new Date(sale.closed_at).toLocaleDateString('es')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
            <p style={{ marginBottom: 8 }}>No hay ventas registradas todavía</p>
            <p style={{ fontSize: 12, color: 'var(--text-faint)' }}>
              Cargá una arriba a mano, o configurá Stripe/Hotmart/Skool en <a href="/configuracion" style={{ color: 'var(--accent)', fontWeight: 600 }}>Settings</a> para que entren solas.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
