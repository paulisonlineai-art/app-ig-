'use client'

import { useState } from 'react'

export default function FlopAutopsy() {
  const [analysis, setAnalysis] = useState('')
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(true)

  const analyze = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/ai/generate-ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Hacé una AUTOPSIA DE FLOPS. Analizá los reels que PEOR funcionaron (los de menor multiplicador) y compará con los mejores. Quiero entender POR QUÉ fallaron.

Respondé con estas secciones:

**DIAGNÓSTICO: ¿Por qué fallaron tus peores reels?**
Analizá los patrones en común de los reels con menor multiplicador: tipo de hook, duración, tema, día/hora, formato narrativo.

**COMPARACIÓN DIRECTA: Flops vs Hits**
Una tabla comparativa de qué hacen diferente tus mejores reels vs tus peores en cada dimensión (hook, duración, tema, engagement type).

**ERRORES RECURRENTES**
Los 3-5 errores que se repiten en tus flops. Sé brutal y específico.

**REGLAS PARA NO REPETIR**
Basándote en los patrones, dá 5 reglas concretas de "nunca hagas X" basadas en evidencia real.

**RESCATE: ¿Algún flop tiene potencial?**
¿Hay algún reel que falló pero tenía buen contenido (alto save rate o comment rate con pocas views)? Eso es contenido bueno con mala distribución — sugerí cómo reciclarlo.

Sé directo, no endulces. Los datos no mienten.`,
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
          <span style={{ fontSize: 20 }}>🔬</span>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 800 }}>Autopsia de Flops</h2>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Descubrí por qué fallaron tus peores reels y cómo no repetirlo</p>
          </div>
        </div>
        <button onClick={() => setExpanded(!expanded)} style={{ background: 'none', border: 'none', fontSize: 16, color: 'var(--text-muted)', cursor: 'pointer' }}>
          {expanded ? '▲' : '▼'}
        </button>
      </div>

      {expanded && (
        <>
          <div style={{ background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.15)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
            <strong style={{ color: '#dc2626' }}>Análisis sin filtro.</strong> Klar compara tus peores reels contra los mejores y te dice exactamente qué salió mal. Los datos no mienten — usá esta info para dejar de repetir errores.
          </div>

          <button
            onClick={analyze}
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', marginBottom: analysis ? 16 : 0, background: loading ? undefined : '#dc2626' }}
          >
            {loading ? '⏳ Haciendo autopsia...' : analysis ? '🔄 Regenerar autopsia' : '🔬 Hacer autopsia de mis flops'}
          </button>

          {loading && (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🔬</div>
              <p style={{ fontSize: 13 }}>Analizando qué salió mal en tus peores reels...</p>
            </div>
          )}

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
