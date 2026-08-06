'use client'
import { useState } from 'react'

export default function ReelDetailClient({ reelId, existingAnalysis }: { reelId: string; existingAnalysis: string }) {
  const [analysis, setAnalysis] = useState(existingAnalysis)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [question, setQuestion] = useState('')
  const [chatAnswer, setChatAnswer] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [chatError, setChatError] = useState('')

  const analyze = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/ai/analyze-reel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reelId }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setError(data.error || 'Error al analizar el reel')
      } else {
        setAnalysis(data.analysis || '')
      }
    } catch {
      setError('Error de conexión — intentá de nuevo')
    } finally {
      setLoading(false)
    }
  }

  const askKlar = async () => {
    if (!question.trim()) return
    setChatLoading(true)
    setChatError('')
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, reelId }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setChatError(data.error || 'Error al consultar')
      } else {
        setChatAnswer(data.answer || '')
      }
    } catch {
      setChatError('Error de conexión — intentá de nuevo')
    } finally {
      setChatLoading(false)
    }
  }

  return (
    <div className="grid-detail-charts-2">
      {/* AI Analysis */}
      <div className="card" style={{ padding: 20 }}>
        <div className="section-header-row" style={{ marginBottom: 14 }}>
          <div>
            <div className="detail-label">ANÁLISIS DE KLAR AI</div>
            <div className="detail-sublabel" style={{ marginTop: 2 }}>Por qué funcionó este reel</div>
          </div>
          <button
            onClick={analyze}
            disabled={loading}
            className="btn btn-primary"
            style={{ fontSize: 12, padding: '7px 14px' }}
          >
            {loading ? '⏳ Analizando...' : analysis ? '🔄 Re-analizar' : '🤖 Analizar con Klar'}
          </button>
        </div>

        {error && <div className="info-banner-error" style={{ marginBottom: 14 }}>{error}</div>}

        {analysis ? (
          <div className="ai-result" style={{ maxHeight: 320, overflowY: 'auto' }}>{analysis}</div>
        ) : !error && (
          <div className="empty-state" style={{ padding: 32 }}>
            <div className="empty-state-icon">🤖</div>
            <p className="empty-state-desc">Hacé clic en &quot;Analizar con Klar&quot; para obtener un análisis completo de este reel</p>
          </div>
        )}
      </div>

      {/* Preguntale a Klar */}
      <div className="card" style={{ padding: 20 }}>
        <div className="detail-label" style={{ marginBottom: 4 }}>PREGUNTALE A KLAR 🔥</div>
        <div className="detail-sublabel" style={{ marginBottom: 14 }}>Hacé cualquier pregunta sobre este reel</div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input
            value={question}
            onChange={e => setQuestion(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && askKlar()}
            placeholder="¿Por qué funcionó tan bien este reel?"
            style={{ flex: 1 }}
          />
          <button onClick={askKlar} disabled={chatLoading || !question.trim()} className="btn btn-primary" style={{ fontSize: 13 }} aria-label="Enviar pregunta">
            {chatLoading ? '⏳' : '→'}
          </button>
        </div>

        {chatError && <div className="info-banner-error" style={{ marginBottom: 12 }}>{chatError}</div>}

        {!chatAnswer && !chatError && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              '¿Por qué funcionó tan bien este reel?',
              '¿Qué hizo diferente el hook vs mis otros reels?',
              '¿Cómo puedo replicar el éxito de este reel?',
            ].map(q => (
              <button key={q} onClick={() => setQuestion(q)} className="suggested-q">
                {q}
              </button>
            ))}
          </div>
        )}

        {chatAnswer && (
          <div className="ai-result" style={{ maxHeight: 280, overflowY: 'auto' }}>{chatAnswer}</div>
        )}
      </div>
    </div>
  )
}
