'use client'
import { useState } from 'react'

export default function TrackingLinkCard({ reelId }: { reelId: string }) {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<{ trackingCode: string; stripeLink: string | null; hotmartLink: string | null } | null>(null)
  const [error, setError] = useState('')

  const generate = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/reels/${reelId}/tracking-link`)
      const json = await res.json()
      if (!res.ok || json.error) { setError(json.error || 'Error generando el link'); return }
      setData(json)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: 8 }}>🔗 LINK DE VENTA</div>
      <p style={{ fontSize: 12, color: 'var(--text-faint)', marginBottom: 12 }}>
        Generá un link único de este reel para pegar en tu flow de ManyChat — las ventas que entren por ahí se atribuyen solas a este reel.
      </p>

      {!data && (
        <button onClick={generate} disabled={loading} className="btn btn-ghost" style={{ fontSize: 13 }}>
          {loading ? '⏳ Generando...' : '⚡ Generar link'}
        </button>
      )}

      {error && (
        <div style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--danger)' }}>
          {error}
        </div>
      )}

      {data && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {data.stripeLink ? (
            <LinkRow label="Stripe" url={data.stripeLink} />
          ) : (
            <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>Stripe: configurá tu Payment Link en Settings para generar este link.</div>
          )}
          {data.hotmartLink ? (
            <LinkRow label="Hotmart" url={data.hotmartLink} />
          ) : (
            <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>Hotmart: configurá tu checkout en Settings para generar este link.</div>
          )}
        </div>
      )}
    </div>
  )
}

function LinkRow({ label, url }: { label: string; url: string }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input readOnly value={url} style={{ flex: 1, fontSize: 11.5, fontFamily: 'monospace', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 10px', color: 'var(--text-muted)' }} />
        <button onClick={() => navigator.clipboard.writeText(url)} className="btn btn-ghost" style={{ fontSize: 12, padding: '6px 10px' }}>📋</button>
      </div>
    </div>
  )
}
