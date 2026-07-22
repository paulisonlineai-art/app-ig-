'use client'
import { useState } from 'react'

const PROMPT_TEMPLATES = [
  {
    label: 'Ideas ganadoras 🏆',
    prompt: 'Basado en los reels que mejor me funcionaron en los últimos 30 días y en los de mis competidores, dame las 5 mejores ideas de contenido posibles para reels de reputación, sin repetir temas ya tocados, usando los mismos principios que los hicieron funcionar.',
  },
  {
    label: 'Por qué fallé ❌',
    prompt: '¿Por qué algunos de mis reels no alcanzaron el promedio? ¿Qué tienen en común los que fallaron? Dame 3 patrones específicos con datos.',
  },
  {
    label: 'Hook ganador 🎣',
    prompt: 'Basado en los hooks de mis reels con mayor multiplicador, ¿cuáles son los 3 tipos de hook que mejor funcionan para mi audiencia? Dame ejemplos concretos y explica por qué funcionan.',
  },
  {
    label: 'Optimizar guardados 🔖',
    prompt: 'Quiero aumentar mi tasa de guardados. Basado en mis reels que tuvieron más guardados que el promedio, ¿qué tipo de contenido debo crear? Dame una estrategia específica.',
  },
  {
    label: 'Mejor día para publicar 📅',
    prompt: '¿Cuál es el mejor día y hora para publicar mis reels? Basate en los datos de cuándo mis reels generan más engagement.',
  },
]

export default function IdeasClient({ topReels, competitors, brandDNA, accountId }: {
  topReels: any[]
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
      {/* Quick prompts as chips */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: 10 }}>PROMPTS RÁPIDOS</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {PROMPT_TEMPLATES.map((t, i) => (
            <button
              key={t.label}
              onClick={() => useTemplate(i)}
              disabled={loading}
              style={{
                padding: '8px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                background: activeTemplate === i ? 'var(--accent)' : 'var(--surface-2)',
                color: activeTemplate === i ? 'white' : 'var(--text)',
                border: activeTemplate === i ? 'none' : '1px solid var(--border)',
                transition: 'all 0.15s',
                opacity: loading ? 0.6 : 1,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Context info */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 16, fontSize: 12, color: 'var(--text-muted)' }}>
        <span>{topReels.length} reels analizados</span>
        <span>{competitors.length} competidores</span>
        <span style={{ color: brandDNA ? 'var(--success)' : 'var(--warning)' }}>
          {brandDNA ? '✓ ADN de marca' : '⚠ Sin ADN de marca'}
        </span>
        {!brandDNA && (
          <a href="/marca" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>Configurar →</a>
        )}
      </div>

      {/* Custom prompt */}
      <div style={{ marginBottom: 16 }}>
        <textarea
          value={prompt}
          onChange={e => { setPrompt(e.target.value); setActiveTemplate(null) }}
          placeholder="O escribí tu propia pregunta... Ej: 'Dame 5 ideas de reels sobre marketing digital que generen guardados'"
          rows={3}
          style={{ width: '100%', resize: 'vertical', fontSize: 13, lineHeight: 1.6, padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text)', fontFamily: 'inherit' }}
        />
      </div>

      <button
        onClick={() => generate()}
        disabled={loading || !prompt.trim()}
        className="btn btn-primary"
        style={{ width: '100%', justifyContent: 'center', padding: '12px', marginBottom: result || error || loading ? 16 : 0 }}
      >
        {loading ? '⏳ Klar está pensando...' : '🤖 Generar con Klar AI'}
      </button>

      {error && (
        <div style={{ padding: 14, background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.15)', borderRadius: 10, color: '#dc2626', fontSize: 13, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🤖</div>
          <p style={{ fontSize: 14, fontWeight: 600 }}>Klar está analizando tus datos...</p>
          <p style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 4 }}>Esto puede tomar unos segundos</p>
        </div>
      )}

      {result && !loading && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>Respuesta de Klar AI</div>
            <button
              onClick={() => navigator.clipboard.writeText(result)}
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 6, padding: '5px 10px', fontSize: 11.5, color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              📋 Copiar
            </button>
          </div>
          <div style={{ fontSize: 13.5, lineHeight: 1.8, color: 'var(--text)', whiteSpace: 'pre-wrap', background: 'var(--surface-2)', borderRadius: 10, padding: 20, border: '1px solid var(--border)' }}>
            {result}
          </div>
        </div>
      )}
    </div>
  )
}
