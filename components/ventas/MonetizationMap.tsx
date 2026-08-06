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
      <div className="collapse-header" style={{ marginBottom: expanded ? 16 : 0 }}>
        <div className="collapse-header-left">
          <span className="collapse-header-icon">💰</span>
          <div>
            <h2 className="collapse-header-title">Mapa de Monetización</h2>
            <p className="collapse-header-desc">Qué contenido genera ventas reales, no solo views</p>
          </div>
        </div>
        <button onClick={() => setExpanded(!expanded)} className="collapse-toggle">
          {expanded ? '▲' : '▼'}
        </button>
      </div>

      {expanded && (
        <>
          <div className="grid-stats-3" style={{ marginBottom: 16, gap: 10 }}>
            <div className="mini-stat-card">
              <div className="mini-stat-value" style={{ color: '#059669' }}>{attributionRate}%</div>
              <div className="mini-stat-label">revenue atribuido</div>
            </div>
            <div className="mini-stat-card">
              <div className="mini-stat-value" style={{ color: 'var(--accent)' }}>{salesWithReels.length}</div>
              <div className="mini-stat-label">ventas con reel</div>
            </div>
            <div className="mini-stat-card">
              <div className="mini-stat-value" style={{ color: '#2563eb' }}>{sales.length - salesWithReels.length}</div>
              <div className="mini-stat-label">sin atribución</div>
            </div>
          </div>

          {Object.keys(byType).length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div className="section-label-xs" style={{ letterSpacing: '0.05em' }}>REVENUE POR TIPO DE CONTENIDO</div>
              {Object.entries(byType)
                .sort((a, b) => b[1].revenue - a[1].revenue)
                .map(([type, data]) => {
                  const pct = revenueFromContent > 0 ? (data.revenue / revenueFromContent) * 100 : 0
                  return (
                    <div key={type} style={{ marginBottom: 8 }}>
                      <div className="engagement-row-header">
                        <span className="engagement-label" style={{ textTransform: 'capitalize' }}>{type.replace(/_/g, ' ')}</span>
                        <span className="engagement-value">${data.revenue.toLocaleString()} <span className="engagement-pct">({data.count})</span></span>
                      </div>
                      <div className="engagement-bar-track">
                        <div className="engagement-bar-fill" style={{ background: '#059669', width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
            </div>
          )}

          {salesWithReels.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div className="section-label-xs" style={{ letterSpacing: '0.05em' }}>REELS QUE GENERARON VENTAS</div>
              {salesWithReels.slice(0, 5).map((s, i) => (
                <div key={i} className="ranked-item" style={{ borderBottom: i < Math.min(salesWithReels.length, 5) - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div className="ranked-badge" style={{ background: '#059669', borderRadius: '50%' }}>
                    ${s.amount >= 1000 ? `${(s.amount / 1000).toFixed(0)}K` : s.amount}
                  </div>
                  <div className="reel-list-text">
                    <div className="reel-list-title">{s.reel_caption?.slice(0, 70) || '(sin caption)'}</div>
                    <div className="reel-list-sub" style={{ whiteSpace: 'normal' }}>
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

          {analysis && !loading && <div className="ai-result">{analysis}</div>}
        </>
      )}
    </div>
  )
}
