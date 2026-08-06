'use client'
import { useState, useRef, useEffect } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const SUGGESTED = [
  '¿Por qué funcionó tan bien mi mejor reel?',
  'Basado en mis métricas, ¿en qué debería enfocarme?',
  'Dame 5 ideas de contenido ganadoras',
  'Sacá ideas de contenido de los comentarios de mi audiencia',
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
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'no se pudo contactar a Klar'
      setMessages(prev => [...prev, { role: 'assistant', content: `Error de conexión: ${msg}` }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(o => !o)}
        className={`chat-fab ${open ? 'chat-fab-open' : 'chat-fab-closed'}`}
      >
        <span className="chat-fab-icon">{open ? '✕' : '🔥'}</span>
        {!open && 'Preguntale a Klar'}
      </button>

      {open && (
        <div className="chat-panel">
          <div className="chat-header">
            <div>
              <div className="chat-header-title">🤖 Klar AI</div>
              <div className="chat-header-sub">Preguntame sobre tu contenido e Instagram</div>
            </div>
            {messages.length > 0 && (
              <button onClick={() => { setMessages([]); setInput('') }} className="chat-new-btn">
                ✦ Nuevo chat
              </button>
            )}
          </div>

          <div className="chat-messages">
            {messages.length === 0 && (
              <div>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 10 }}>
                  ¿Qué querés saber de tu cuenta?
                </p>
                {SUGGESTED.map(p => (
                  <button key={p} onClick={() => send(p)} className="chat-suggestion">{p}</button>
                ))}
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`chat-bubble ${m.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-assistant'}`}>
                {m.content}
              </div>
            ))}

            {loading && (
              <div className="chat-bubble chat-bubble-assistant">
                ⏳ Analizando tus datos...
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="chat-input-bar">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
              placeholder="Preguntá algo sobre tu contenido..."
              disabled={loading}
              style={{ flex: 1 }}
            />
            <button
              onClick={() => send()}
              disabled={loading || !input.trim()}
              aria-label="Enviar mensaje"
              className="chat-send-btn"
            >→</button>
          </div>
        </div>
      )}
    </>
  )
}
