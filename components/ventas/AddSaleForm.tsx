'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AddSaleForm({ accountId, reels }: { accountId: string; reels: any[] }) {
  const [form, setForm] = useState({ amount: '', installments: '1', closed_at: new Date().toISOString().split('T')[0], reel_id: '', notes: '' })
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const amountNum = parseFloat(form.amount) || 0
  const installmentsNum = parseInt(form.installments) || 1
  const perInstallment = amountNum / installmentsNum

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
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
      }
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    background: 'var(--surface-2)',
    border: '1px solid var(--border)',
    borderRadius: 10,
    padding: '12px 14px',
    color: 'var(--text)',
    fontSize: 14,
    outline: 'none',
    width: '100%',
  }

  return (
    <form onSubmit={submit}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div>
          <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Valor total (USD)</label>
          <input type="number" placeholder="8000" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} style={inputStyle} required />
        </div>
        <div>
          <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Cuotas</label>
          <input type="number" min="1" value={form.installments} onChange={e => setForm(f => ({ ...f, installments: e.target.value }))} style={inputStyle} />
        </div>
        <div>
          <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Fecha de cierre</label>
          <input type="date" value={form.closed_at} onChange={e => setForm(f => ({ ...f, closed_at: e.target.value }))} style={inputStyle} />
        </div>
      </div>

      {amountNum > 0 && installmentsNum > 1 && (
        <div style={{ padding: '10px 14px', background: 'var(--surface-2)', borderRadius: 8, marginBottom: 12, fontSize: 13, color: 'var(--text-muted)' }}>
          {installmentsNum} cuotas de ${perInstallment.toFixed(0)} — Primer cobro: ${perInstallment.toFixed(0)} — Pendiente: ${(amountNum - perInstallment).toFixed(0)}
        </div>
      )}

      <div style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>¿De qué reel vino? (opcional)</label>
        <select value={form.reel_id} onChange={e => setForm(f => ({ ...f, reel_id: e.target.value }))} style={{ ...inputStyle }}>
          <option value="">— Sin atribuir —</option>
          {reels.map((r: any) => (
            <option key={r.id} value={r.id}>{r.caption?.slice(0, 70) || r.id}</option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={loading || !form.amount}
        style={{
          background: loading ? 'var(--border)' : 'var(--accent)',
          color: 'white',
          border: 'none',
          padding: '12px 24px',
          borderRadius: 10,
          fontWeight: 700,
          fontSize: 14,
          cursor: loading ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? 'Guardando...' : 'Guardar venta'}
      </button>
    </form>
  )
}
