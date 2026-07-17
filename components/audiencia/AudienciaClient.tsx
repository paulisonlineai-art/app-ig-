'use client'

import { useState } from 'react'

export default function AudienciaClient({ topReels, allReels, followers, engagementRate, bestDay }: {
  topReels: any[]
  allReels: any[]
  followers: number
  engagementRate: string
  bestDay: string
}) {
  const [analysis, setAnalysis] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const generateAnalysis = async () => {
    setLoading(true)
    setError('')
    try {
      const context = {
        followers,
        engagementRate,
        bestDay,
        totalReels: allReels.length,
        topReels: topReels.slice(0, 8).map((r: any) => ({
          caption: r.caption?.slice(0, 200),
          views: r.views,
          multiplier: r.multiplier,
          hook: r.hook,
          likes: r.likes,
          comments: r.comments,
          saves: r.saves,
          shares: r.shares,
        })),
        worstReels: [...allReels].sort((a: any, b: any) => a.multiplier - b.multiplier).slice(0, 5).map((r: any) => ({
          caption: r.caption?.slice(0, 200),
          views: r.views,
          multiplier: r.multiplier,
          hook: r.hook,
        })),
      }

      const res = await fetch('/api/ai/generate-ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Analiza la audiencia de esta cuenta de Instagram basándote en los datos de sus reels. No inventes datos. Responde en español.

DATOS DE LA CUENTA:
- Seguidores: ${context.followers}
- Engagement rate: ${context.engagementRate}%
- Mejor día para publicar: ${context.bestDay}
- Reels analizados: ${context.totalReels}

TOP REELS (los que mejor funcionaron):
${context.topReels.map((r: any, i: number) => `${i + 1}. "${r.caption}" — ${r.views} views, ${r.multiplier?.toFixed(2)}x, hook: "${r.hook}", likes: ${r.likes}, comments: ${r.comments}, saves: ${r.saves}`).join('\n')}

PEORES REELS:
${context.worstReels.map((r: any, i: number) => `${i + 1}. "${r.caption}" — ${r.views} views, ${r.multiplier?.toFixed(2)}x, hook: "${r.hook}"`).join('\n')}

Dame un análisis estructurado con estas secciones exactas:

**PERFIL DE TU AUDIENCIA**
Describe quién es tu audiencia basándote en qué contenido consumen más.

**TEMAS QUE DOMINAN**
Lista los 4-5 temas que más engagement generan, con el engagement promedio de cada uno.

**SENTIMIENTO GENERAL**
Basándote en el engagement rate y los saves/shares vs likes, estima el nivel de conexión de la audiencia.

**OPORTUNIDADES DE CONTENIDO**
5 ideas de contenido basadas en lo que tu audiencia demuestra que quiere ver (basado en los datos, no genéricas).

**PATRONES DE ENGAGEMENT**
Qué tipo de hooks, temas y formatos generan más saves y shares (indicadores de contenido de valor).`
        }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setError(data.error || 'Error generando análisis')
        return
      }
      setAnalysis(data.result || '')
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card" style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700 }}>Análisis IA de tu audiencia</h2>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            Basado en {allReels.length} reels analizados
          </p>
        </div>
        <button
          onClick={generateAnalysis}
          disabled={loading}
          className="btn btn-primary"
        >
          {loading ? '⏳ Analizando...' : analysis ? '🔄 Regenerar' : '🤖 Analizar audiencia'}
        </button>
      </div>

      {error && (
        <div style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--danger)', marginBottom: 16 }}>
          {error}
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>👥</div>
          <p style={{ fontSize: 14, fontWeight: 600 }}>Analizando tu audiencia...</p>
          <p style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 4 }}>Esto puede tomar unos segundos</p>
        </div>
      )}

      {analysis && !loading && (
        <div style={{ fontSize: 13.5, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
          {analysis}
        </div>
      )}

      {!analysis && !loading && (
        <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
          <p style={{ fontSize: 14 }}>Haz clic en "Analizar audiencia" para obtener un análisis IA</p>
          <p style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 4 }}>
            Perfil de audiencia, temas que dominan, sentimiento, oportunidades
          </p>
        </div>
      )}
    </div>
  )
}
