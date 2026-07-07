'use client'
import { useState } from 'react'

const inputStyle = {
  background: 'var(--surface-2)',
  border: '1px solid var(--border)',
  borderRadius: 10,
  padding: '10px 12px',
  color: 'var(--text)',
  fontSize: 13,
  outline: 'none',
  width: '100%',
}

function WebhookUrlRow({ url }: { url: string }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
      <input readOnly value={url} style={{ ...inputStyle, fontFamily: 'monospace', fontSize: 11.5, color: 'var(--text-muted)' }} />
      <button type="button" onClick={() => navigator.clipboard.writeText(url)} className="btn btn-ghost" style={{ fontSize: 12, padding: '8px 10px', whiteSpace: 'nowrap' }}>
        📋 Copiar
      </button>
    </div>
  )
}

export default function PaymentIntegrationsForm({ accountId, initial }: { accountId: string; initial: any }) {
  const [form, setForm] = useState({
    stripe_payment_link_base: initial?.stripe_payment_link_base || '',
    stripe_webhook_secret: initial?.stripe_webhook_secret || '',
    hotmart_checkout_url_base: initial?.hotmart_checkout_url_base || '',
    hotmart_hottok: initial?.hotmart_hottok || '',
    skool_fixed_price: initial?.skool_fixed_price || '',
    skool_webhook_secret: initial?.skool_webhook_secret || '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const origin = typeof window !== 'undefined' ? window.location.origin : ''

  const save = async () => {
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/settings/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'No se pudo guardar')
        return
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e: any) {
      setError(e.message || 'No se pudo guardar')
    } finally {
      setSaving(false)
    }
  }

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [key]: e.target.value }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Stripe */}
      <div>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>💳 Stripe</div>
        <p style={{ fontSize: 11.5, color: 'var(--text-faint)', marginBottom: 8 }}>
          Pegá tu Payment Link (sin parámetros) y configurá este endpoint como webhook de Stripe para el evento <code>checkout.session.completed</code>. El secreto es el "Signing secret" que Stripe te muestra al crear el webhook.
        </p>
        <WebhookUrlRow url={`${origin}/api/webhooks/stripe/${accountId}`} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <input placeholder="https://buy.stripe.com/xxxx" value={form.stripe_payment_link_base} onChange={set('stripe_payment_link_base')} style={inputStyle} />
          <input placeholder="whsec_..." type="password" value={form.stripe_webhook_secret} onChange={set('stripe_webhook_secret')} style={inputStyle} />
        </div>
      </div>

      {/* Hotmart */}
      <div>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>🔶 Hotmart</div>
        <p style={{ fontSize: 11.5, color: 'var(--text-faint)', marginBottom: 8 }}>
          Pegá el link de checkout de tu producto (sin parámetros) y configurá este endpoint en tu Webhook 2.0 de Hotmart. El "Hottok" está en la configuración del webhook.
        </p>
        <WebhookUrlRow url={`${origin}/api/webhooks/hotmart/${accountId}`} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <input placeholder="https://pay.hotmart.com/XXXX" value={form.hotmart_checkout_url_base} onChange={set('hotmart_checkout_url_base')} style={inputStyle} />
          <input placeholder="Hottok" type="password" value={form.hotmart_hottok} onChange={set('hotmart_hottok')} style={inputStyle} />
        </div>
      </div>

      {/* Skool */}
      <div>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>🟢 Skool</div>
        <p style={{ fontSize: 11.5, color: 'var(--text-faint)', marginBottom: 8 }}>
          Skool no tiene webhooks propios — conectá "nuevo miembro pago" con Zapier y hacé que llame a este endpoint con header <code>Authorization: Bearer &lt;secreto&gt;</code>. Como Skool no informa el monto ni el reel de origen, se registra con un precio fijo y sin atribuir.
        </p>
        <WebhookUrlRow url={`${origin}/api/webhooks/skool/${accountId}`} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <input placeholder="Precio fijo USD" type="number" value={form.skool_fixed_price} onChange={set('skool_fixed_price')} style={inputStyle} />
          <input placeholder="Secreto compartido" type="password" value={form.skool_webhook_secret} onChange={set('skool_webhook_secret')} style={inputStyle} />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={save} disabled={saving} className="btn btn-primary" style={{ padding: '10px 24px', fontSize: 13 }}>
          {saving ? 'Guardando...' : '💾 Guardar integraciones'}
        </button>
        {saved && <span style={{ fontSize: 13, color: 'var(--success)', fontWeight: 600 }}>✓ Guardado</span>}
        {error && <span style={{ fontSize: 13, color: 'var(--danger)', fontWeight: 600 }}>✗ {error}</span>}
      </div>
    </div>
  )
}
