'use client'
import { useState, useRef, useEffect } from 'react'

type Message = { role: 'user' | 'assistant'; content: string }

const SUGGESTED = [
  '¿Por qué funcionó tan bien mi mejor reel?',
  'Basado en mis métricas, ¿en qué debería enfocarme?',
  'Dame 5 ideas de contenido ganadoras',
  '¿Cuál es mi tasa de guardados y cómo mejorarla?',
]

export default function KlarChat() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async (text?: string) => {
    const q = text || input.trim()
    if (!q) return
    setMessages(prev => [...prev, { role: 'user', content: q }])
    setInput('')
    setLoading(true)
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.answer || data.error || 'Error' }])
    } catch (e: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Error de conexión: ${e.message || 'no se pudo contactar a Klar'}` }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: 'fixed', bottom: 24, right: 24,
          display: 'flex', alignItems: 'center', gap: 8,
          background: open ? '#5b21b6' : 'var(--accent)',
          color: 'white', border: 'none',
          padding: open ? '12px 16px' : '12px 18px',
          borderRadius: 50,
          fontWeight: 700, fontSize: 13,
          cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(124,58,237,0.4)',
          zIndex: 1000,
          transition: 'all 0.2s',
        }}
      >
        <span style={{ fontSize: 16 }}>{open ? '✕' : '🔥'}</span>
        {!open && 'Preguntale a Klar'}
      </button>

      {/* Panel */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 80, right: 24,
          width: 'min(420px, calc(100vw - 48px))', height: 'min(580px, calc(100vh - 120px))',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 20,
          display: 'flex', flexDirection: 'column',
          zIndex: 999,
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--accent)', color: 'white' }}>
            <div style={{ fontWeight: 800, fontSize: 15 }}>🤖 Klar AI</div>
            <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>Preguntame sobre tu contenido e Instagram</div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.length === 0 && (
              <div>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 10 }}>¿Qué querés saber de tu cuenta?</p>
                {SUGGESTED.map(p => (
                  <button key={p} onClick={() => send(p)} style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    background: 'var(--surface-2)', border: '1px solid var(--border)',
                    borderRadius: 8, padding: '9px 12px', fontSize: 12.5,
                    color: 'var(--text)', cursor: 'pointer', marginBottom: 6,
                    transition: 'border-color 0.15s',
                  }}>
                    {p}
                  </button>
                ))}
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} style={{
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '87%',
                background: m.role === 'user' ? 'var(--accent)' : 'var(--surface-2)',
                color: m.role === 'user' ? 'white' : 'var(--text)',
                borderRadius: m.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                padding: '10px 14px',
                fontSize: 13, lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
                border: m.role === 'assistant' ? '1px solid var(--border)' : 'none',
              }}>
                {m.content}
              </div>
            ))}

            {loading && (
              <div style={{
                alignSelf: 'flex-start', background: 'var(--surface-2)',
                borderRadius: '14px 14px 14px 4px', padding: '10px 14px',
                fontSize: 13, border: '1px solid var(--border)', color: 'var(--text-muted)',
              }}>
                ⏳ Analizando tus datos...
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: 12, borderTop: '1px solid var(--border)', display: 'flex', gap: 8, background: 'var(--surface)' }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
              placeholder="Preguntá algo sobre tu contenido..."
              disabled={loading}
              style={{ flex: 1, fontSize: 13, padding: '9px 12px' }}
            />
            <button
              onClick={() => send()}
              disabled={loading || !input.trim()}
              aria-label="Enviar mensaje"
              style={{
                background: 'var(--accent)', color: 'white', border: 'none',
                padding: '9px 14px', borderRadius: 8, fontSize: 15,
                cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1,
              }}
            >→</button>
          </div>
        </div>
      )}
    </>
  )
}
