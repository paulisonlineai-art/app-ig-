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
  const [history, setHistory] = useState<{ prompt: string; result: string }[]>([])

  const [error, setError] = useState('')

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
      if (data.result) setHistory(h => [{ prompt: q, result: data.result }, ...h.slice(0, 9)])
    } catch {
      setError('Error de conexión — intentá de nuevo')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid-ideas">
      {/* Left panel */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Quick templates */}
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: 12 }}>PROMPTS RÁPIDOS</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {PROMPT_TEMPLATES.map(t => (
              <button
                key={t.label}
                onClick={() => { setPrompt(t.prompt); generate(t.prompt) }}
                disabled={loading}
                style={{
                  background: 'var(--surface-2)', border: '1.5px solid var(--border)',
                  borderRadius: 8, padding: '10px 12px',
                  fontSize: 13, fontWeight: 600, color: 'var(--text)',
                  cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text)' }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Context summary */}
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: 10 }}>CONTEXTO DISPONIBLE</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Tus reels analizados</span>
              <span style={{ fontWeight: 700 }}>{topReels.length}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Competidores trackeados</span>
              <span style={{ fontWeight: 700 }}>{competitors.length}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>ADN de marca</span>
              <span style={{ fontWeight: 700, color: brandDNA ? 'var(--success)' : 'var(--warning)' }}>
                {brandDNA ? '✓ Configurado' : '⚠ Sin configurar'}
              </span>
            </div>
          </div>
          {!brandDNA && (
            <a href="/marca" style={{ display: 'block', marginTop: 10, fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>
              → Configurar ADN de Marca
            </a>
          )}
        </div>

        {/* History */}
        {history.length > 0 && (
          <div className="card" style={{ padding: 18 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: 10 }}>HISTORIAL</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {history.map((h, i) => (
                <button key={i} onClick={() => { setPrompt(h.prompt); setResult(h.result) }}
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 6, padding: '7px 10px', fontSize: 11.5, color: 'var(--text-muted)', cursor: 'pointer', textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {h.prompt.slice(0, 55)}...
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right panel */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Custom prompt */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: 12 }}>TU PROMPT</div>
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="Describí lo que querés que Klar analice o genere. Podés pedirle ideas de contenido, análisis de qué funcionó, estrategias específicas..."
            rows={4}
            style={{ width: '100%', resize: 'vertical', marginBottom: 10, fontSize: 13, lineHeight: 1.6 }}
          />
          <button
            onClick={() => generate()}
            disabled={loading || !prompt.trim()}
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
          >
            {loading ? '⏳ Klar está pensando...' : '🤖 Generar con Klar AI →'}
          </button>
        </div>

        {error && (
          <div className="card" style={{ padding: 16, background: 'var(--danger-bg)', border: '1px solid var(--danger)', color: 'var(--danger)', fontSize: 13 }}>
            {error}
          </div>
        )}

        {/* Result */}
        {(result || loading) && (
          <div className="card" style={{ padding: 24 }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🤖</div>
                <p style={{ fontSize: 14, fontWeight: 600 }}>Klar está analizando tus datos...</p>
                <p style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 4 }}>Esto puede tomar unos segundos</p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>Respuesta de Klar AI</div>
                  <button
                    onClick={() => navigator.clipboard.writeText(result)}
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 6, padding: '5px 10px', fontSize: 11.5, color: 'var(--text-muted)', cursor: 'pointer' }}
                  >
                    📋 Copiar
                  </button>
                </div>
                <div style={{ fontSize: 13.5, lineHeight: 1.8, color: 'var(--text)', whiteSpace: 'pre-wrap' }}>
                  {result}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
