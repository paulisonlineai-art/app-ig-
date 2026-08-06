'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type ReelOption = { id: string; caption: string | null }

export default function AddSaleForm({ accountId, reels }: { accountId: string; reels: ReelOption[] }) {
  const [form, setForm] = useState({ amount: '', installments: '1', closed_at: new Date().toISOString().split('T')[0], reel_id: '', notes: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const amountNum = parseFloat(form.amount) || 0
  const installmentsNum = parseInt(form.installments) || 1
  const perInstallment = amountNum / installmentsNum

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/sales/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amountNum,
          installments: installmentsNum,
          amount_per_installment: perInstallment,
          cash_collected: perInstallment,
          pending_amount: amountNum - perInstallment,
          closed_at: form.closed_at,
          reel_id: form.reel_id || null,
          notes: form.notes,
        }),
      })
      if (res.ok) {
        setForm({ amount: '', installments: '1', closed_at: new Date().toISOString().split('T')[0], reel_id: '', notes: '' })
        router.refresh()
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'No se pudo guardar la venta')
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar la venta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div>
          <label className="form-label">Valor total (USD)</label>
          <input type="number" placeholder="8000" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required />
        </div>
        <div>
          <label className="form-label">Cuotas</label>
          <input type="number" min="1" value={form.installments} onChange={e => setForm(f => ({ ...f, installments: e.target.value }))} />
        </div>
        <div>
          <label className="form-label">Fecha de cierre</label>
          <input type="date" value={form.closed_at} onChange={e => setForm(f => ({ ...f, closed_at: e.target.value }))} />
        </div>
      </div>

      {amountNum > 0 && installmentsNum > 1 && (
        <div className="info-banner" style={{ marginBottom: 12, fontSize: 13 }}>
          {installmentsNum} cuotas de ${perInstallment.toFixed(0)} — Primer cobro: ${perInstallment.toFixed(0)} — Pendiente: ${(amountNum - perInstallment).toFixed(0)}
        </div>
      )}

      <div style={{ marginBottom: 12 }}>
        <label className="form-label">¿De qué reel vino? (opcional)</label>
        <select value={form.reel_id} onChange={e => setForm(f => ({ ...f, reel_id: e.target.value }))}>
          <option value="">— Sin atribuir —</option>
          {reels.map(r => (
            <option key={r.id} value={r.id}>{r.caption?.slice(0, 70) || r.id}</option>
          ))}
        </select>
      </div>

      {error && <div className="info-banner-error" style={{ marginBottom: 12 }}>{error}</div>}

      <button type="submit" disabled={loading || !form.amount} className="btn btn-primary" style={{ padding: '12px 24px', fontSize: 14 }}>
        {loading ? 'Guardando...' : 'Guardar venta'}
      </button>
    </form>
  )
}
