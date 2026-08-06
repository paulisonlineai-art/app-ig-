'use client'
import { useState } from 'react'

const PROMPT_TEMPLATES = [
  {
    label: 'Ideas ganadoras',
    prompt: 'Basado en los reels que mejor me funcionaron en los últimos 30 días y en los de mis competidores, dame las 5 mejores ideas de contenido posibles para reels de reputación, sin repetir temas ya tocados, usando los mismos principios que los hicieron funcionar.',
  },
  {
    label: 'Por qué fallé',
    prompt: '¿Por qué algunos de mis reels no alcanzaron el promedio? ¿Qué tienen en común los que fallaron? Dame 3 patrones específicos con datos.',
  },
  {
    label: 'Hook ganador',
    prompt: 'Basado en los hooks de mis reels con mayor multiplicador, ¿cuáles son los 3 tipos de hook que mejor funcionan para mi audiencia? Dame ejemplos concretos y explica por qué funcionan.',
  },
  {
    label: 'Optimizar guardados',
    prompt: 'Quiero aumentar mi tasa de guardados. Basado en mis reels que tuvieron más guardados que el promedio, ¿qué tipo de contenido debo crear? Dame una estrategia específica.',
  },
  {
    label: 'Mejor día para publicar',
    prompt: '¿Cuál es el mejor día y hora para publicar mis reels? Basate en los datos de cuándo mis reels generan más engagement.',
  },
]

type TopReel = { caption: string | null; views: number; hook: string | null }

export default function IdeasClient({ topReels, competitors, brandDNA, accountId }: {
  topReels: TopReel[]
  competitors: string[]
  brandDNA: string
  accountId: string
}) {
  const [prompt, setPrompt] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeTemplate, setActiveTemplate] = useState<number | null>(null)

  const generate = async (customPrompt?: string) => {
    const q = customPrompt || prompt
    if (!q.trim()) return
    setLoading(true)
    setResult('')
    setError('')
    try {
      const res = await fetch('/api/ai/generate-ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: q }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setError(data.error || 'Error generando ideas')
        return
      }
      setResult(data.result || '')
    } catch {
      setError('Error de conexión — intentá de nuevo')
    } finally {
      setLoading(false)
    }
  }

  const useTemplate = (index: number) => {
    const t = PROMPT_TEMPLATES[index]
    setActiveTemplate(index)
    setPrompt(t.prompt)
    generate(t.prompt)
  }

  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ marginBottom: 16 }}>
        <div className="section-label-sm" style={{ marginBottom: 10 }}>PROMPTS RÁPIDOS</div>
        <div className="pill-select">
          {PROMPT_TEMPLATES.map((t, i) => (
            <button
              key={t.label}
              onClick={() => useTemplate(i)}
              disabled={loading}
              className={`pill-option ${activeTemplate === i ? 'pill-option-active' : 'pill-option-inactive'}`}
              style={{ opacity: loading ? 0.6 : 1 }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 16, fontSize: 12, color: 'var(--text-muted)' }}>
        <span>{topReels.length} reels analizados</span>
        <span>{competitors.length} competidores</span>
        <span style={{ color: brandDNA ? 'var(--success)' : 'var(--warning)' }}>
          {brandDNA ? '✓ ADN de marca' : '⚠ Sin ADN de marca'}
        </span>
        {!brandDNA && (
          <a href="/marca" className="warning-link">Configurar →</a>
        )}
      </div>

      <div style={{ marginBottom: 16 }}>
        <textarea
          value={prompt}
          onChange={e => { setPrompt(e.target.value); setActiveTemplate(null) }}
          placeholder="O escribí tu propia pregunta... Ej: 'Dame 5 ideas de reels sobre marketing digital que generen guardados'"
          rows={3}
          style={{ width: '100%', resize: 'vertical', fontSize: 13, lineHeight: 1.6 }}
        />
      </div>

      <button
        onClick={() => generate()}
        disabled={loading || !prompt.trim()}
        className="btn btn-primary"
        style={{ width: '100%', justifyContent: 'center', padding: 12, marginBottom: result || error || loading ? 16 : 0 }}
      >
        {loading ? '⏳ Klar está pensando...' : '🤖 Generar con Klar AI'}
      </button>

      {error && <div className="info-banner-error" style={{ marginBottom: 16 }}>{error}</div>}

      {loading && (
        <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🤖</div>
          <p style={{ fontSize: 14, fontWeight: 600 }}>Klar está analizando tus datos...</p>
          <p style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 4 }}>Esto puede tomar unos segundos</p>
        </div>
      )}

      {result && !loading && (
        <div>
          <div className="section-header-row" style={{ marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 700 }}>Respuesta de Klar AI</span>
            <button
              onClick={() => navigator.clipboard.writeText(result)}
              className="btn btn-ghost"
              style={{ fontSize: 11.5, padding: '5px 10px' }}
            >
              📋 Copiar
            </button>
          </div>
          <div className="ai-result">{result}</div>
        </div>
      )}
    </div>
  )
}
