'use client'

import { useState } from 'react'

type SaleWithReel = {
  amount: number
  closed_at: string
  source: string
  reel_caption: string | null
  reel_views: number | null
  reel_multiplier: number | null
  reel_hook: string | null
  reel_narrative_type: string | null
  reel_save_rate: number | null
}

export default function MonetizationMap({ sales, totalRevenue }: { sales: SaleWithReel[]; totalRevenue: number }) {
  const [analysis, setAnalysis] = useState('')
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(true)

  const salesWithReels = sales.filter(s => s.reel_caption)
  const revenueFromContent = salesWithReels.reduce((s, r) => s + r.amount, 0)
  const attributionRate = totalRevenue > 0 ? ((revenueFromContent / totalRevenue) * 100).toFixed(0) : '0'

  // Group by narrative type
  const byType: Record<string, { count: number; revenue: number }> = {}
  for (const s of salesWithReels) {
    const type = s.reel_narrative_type || 'sin_clasificar'
    if (!byType[type]) byType[type] = { count: 0, revenue: 0 }
    byType[type].count++
    byType[type].revenue += s.amount
  }

  const generateAnalysis = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/ai/generate-ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Analizá mi MAPA DE MONETIZACIÓN: qué tipo de contenido genera ventas reales (no solo views).

VENTAS ATRIBUIDAS A CONTENIDO:
${salesWithReels.map((s, i) => `${i + 1}. $${s.amount} — Reel: "${s.reel_caption?.slice(0, 100)}" | Views: ${s.reel_views?.toLocaleString() || '?'} | Hook: "${s.reel_hook || '?'}" | Tipo: ${s.reel_narrative_type || '?'} | Save rate: ${s.reel_save_rate?.toFixed(1) || '?'}%`).join('\n')}

REVENUE POR TIPO DE CONTENIDO:
${Object.entries(byType).map(([type, data]) => `- ${type}: $${data.revenue.toLocaleString()} (${data.count} ventas)`).join('\n')}

TOTALES:
- Revenue total: $${totalRevenue.toLocaleString()}
- Revenue atribuido a contenido: $${revenueFromContent.toLocaleString()} (${attributionRate}%)
- Ventas sin atribución: ${sales.length - salesWithReels.length}

Respondé con:

**QUÉ TIPO DE CONTENIDO VENDE**
¿Qué formato, tema y tipo de hook genera más ventas? ¿Los reels que venden son los mismos que tienen más views?

**REVENUE POR VISTA**
¿Cuáles son los reels con mejor ratio $/views? (contenido que no necesita ser viral para vender)

**PATRÓN DE CONVERSIÓN**
¿Qué tienen en común los reels que generan ventas? Hook type, CTA, duración, tema.

**ESTRATEGIA DE CONTENIDO PARA VENDER**
5 recomendaciones concretas para hacer más contenido que convierta, basadas en los patrones detectados.

**CONTENT-TO-CASH RATIO**
¿Cuántos reels tenés que publicar para generar una venta? ¿Qué tipo de reel acorta ese ciclo?

Sé específico con números reales.`,
        }),
      })
      const data = await res.json()
      if (data.result) setAnalysis(data.result)
    } catch { /* ignore */ } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card" style={{ padding: 20, marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: expanded ? 16 : 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>💰</span>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 800 }}>Mapa de Monetización</h2>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Qué contenido genera ventas reales, no solo views</p>
          </div>
        </div>
        <button onClick={() => setExpanded(!expanded)} style={{ background: 'none', border: 'none', fontSize: 16, color: 'var(--text-muted)', cursor: 'pointer' }}>
          {expanded ? '▲' : '▼'}
        </button>
      </div>

      {expanded && (
        <>
          {/* Quick stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
            <div style={{ background: 'var(--surface-2)', borderRadius: 10, padding: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#059669' }}>{attributionRate}%</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500 }}>revenue atribuido</div>
            </div>
            <div style={{ background: 'var(--surface-2)', borderRadius: 10, padding: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent)' }}>{salesWithReels.length}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500 }}>ventas con reel</div>
            </div>
            <div style={{ background: 'var(--surface-2)', borderRadius: 10, padding: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#2563eb' }}>{sales.length - salesWithReels.length}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500 }}>sin atribución</div>
            </div>
          </div>

          {/* Revenue by content type */}
          {Object.keys(byType).length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '0.05em' }}>REVENUE POR TIPO DE CONTENIDO</div>
              {Object.entries(byType)
                .sort((a, b) => b[1].revenue - a[1].revenue)
                .map(([type, data]) => {
                  const pct = revenueFromContent > 0 ? (data.revenue / revenueFromContent) * 100 : 0
                  return (
                    <div key={type} style={{ marginBottom: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, textTransform: 'capitalize' }}>{type.replace(/_/g, ' ')}</span>
                        <span style={{ fontSize: 12, fontWeight: 700 }}>${data.revenue.toLocaleString()} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({data.count})</span></span>
                      </div>
                      <div style={{ height: 6, background: 'var(--surface-2)', borderRadius: 3 }}>
                        <div style={{ height: '100%', background: '#059669', borderRadius: 3, width: `${pct}%`, transition: 'width 0.5s' }} />
                      </div>
                    </div>
                  )
                })}
            </div>
          )}

          {/* Top selling reels */}
          {salesWithReels.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '0.05em' }}>REELS QUE GENERARON VENTAS</div>
              {salesWithReels.slice(0, 5).map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < Math.min(salesWithReels.length, 5) - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#059669', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                    ${s.amount >= 1000 ? `${(s.amount / 1000).toFixed(0)}K` : s.amount}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.reel_caption?.slice(0, 70) || '(sin caption)'}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                      {s.reel_views?.toLocaleString() || '?'} views · {s.reel_multiplier?.toFixed(1) || '?'}x · {new Date(s.closed_at).toLocaleDateString('es')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={generateAnalysis}
            disabled={loading || salesWithReels.length === 0}
            className="btn btn-primary"
            style={{ width: '100%', marginBottom: analysis ? 16 : 0 }}
          >
            {salesWithReels.length === 0
              ? '⚠ Atribuí ventas a reels para activar el análisis'
              : loading ? '⏳ Analizando patrones de conversión...' : analysis ? '🔄 Regenerar análisis' : '💰 Analizar qué contenido vende'}
          </button>

          {analysis && !loading && (
            <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, fontSize: 13.5, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
              {analysis}
            </div>
          )}
        </>
      )}
    </div>
  )
}
