'use client'
import { useState } from 'react'

export default function ReelDetailClient({ reelId, existingAnalysis }: { reelId: string; existingAnalysis: string }) {
  const [analysis, setAnalysis] = useState(existingAnalysis)
  const [loading, setLoading] = useState(false)
  const [question, setQuestion] = useState('')
  const [chatAnswer, setChatAnswer] = useState('')
  const [chatLoading, setChatLoading] = useState(false)

  const analyze = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/ai/analyze-reel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reelId }),
      })
      const data = await res.json()
      setAnalysis(data.analysis || '')
    } finally {
      setLoading(false)
    }
  }

  const askMoka = async () => {
    if (!question.trim()) return
    setChatLoading(true)
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: `Sobre este reel específico (ID: ${reelId}): ${question}` }),
      })
      const data = await res.json()
      setChatAnswer(data.answer || '')
    } finally {
      setChatLoading(false)
    }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      {/* AI Analysis */}
      <div className="card" style={{ padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em' }}>ANÁLISIS DE MOKA AI</div>
            <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 2 }}>Por qué funcionó este reel</div>
          </div>
          <button
            onClick={analyze}
            disabled={loading}
            className="btn btn-primary"
            style={{ fontSize: 12, padding: '7px 14px' }}
          >
            {loading ? '⏳ Analizando...' : analysis ? '🔄 Re-analizar' : '🤖 Analizar con Moka'}
          </button>
        </div>

        {analysis ? (
          <div style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--text)', whiteSpace: 'pre-wrap', maxHeight: 320, overflowY: 'auto' }}>
            {analysis}
          </div>
        ) : (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-faint)' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🤖</div>
            <p style={{ fontSize: 13 }}>Hacé clic en "Analizar con Moka" para obtener un análisis completo de este reel</p>
          </div>
        )}
      </div>

      {/* Preguntale a Moka */}
      <div className="card" style={{ padding: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: 4 }}>PREGUNTALE A MOKA 🔥</div>
        <div style={{ fontSize: 11, color: 'var(--text-faint)', marginBottom: 14 }}>Hacé cualquier pregunta sobre este reel</div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input
            value={question}
            onChange={e => setQuestion(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && askMoka()}
            placeholder="¿Por qué funcionó tan bien este reel?"
            style={{ flex: 1, fontSize: 13 }}
          />
          <button onClick={askMoka} disabled={chatLoading || !question.trim()} className="btn btn-primary" style={{ fontSize: 13 }}>
            {chatLoading ? '⏳' : '→'}
          </button>
        </div>

        {/* Suggested questions */}
        {!chatAnswer && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              '¿Por qué funcionó tan bien este reel?',
              '¿Qué hizo diferente el hook vs mis otros reels?',
              '¿Cómo puedo replicar el éxito de este reel?',
            ].map(q => (
              <button key={q} onClick={() => { setQuestion(q); }} style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: 'var(--text-muted)', cursor: 'pointer', textAlign: 'left' }}>
                {q}
              </button>
            ))}
          </div>
        )}

        {chatAnswer && (
          <div style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--text)', whiteSpace: 'pre-wrap', maxHeight: 280, overflowY: 'auto', background: 'var(--surface-2)', borderRadius: 10, padding: 14 }}>
            {chatAnswer}
          </div>
        )}
      </div>
    </div>
  )
}
