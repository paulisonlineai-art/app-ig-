'use client'
import { useState } from 'react'

const ANGLES = ['Mismo tema, mi nicho', 'Hook replicado', 'Estructura exacta', 'Tono contrario', 'Caso de cliente']

export default function CompetitorReelAdapt({ reel }: { reel: any }) {
  const [transcribing, setTranscribing] = useState(false)
  const [adapting, setAdapting] = useState(false)
  const [transcript, setTranscript] = useState(reel.transcript || '')
  const [adaptation, setAdaptation] = useState(reel.adaptation || '')
  const [customAngle, setCustomAngle] = useState('')
  const [error, setError] = useState('')

  const adapt = async (angle?: string) => {
    setError('')
    setAdapting(true)
    try {
      const res = await fetch('/api/competitors/reels/adapt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reelId: reel.id, angle: angle || '' }),
      })
      const data = await res.json()
      if (!res.ok || data.error) { setError(data.error || 'Error al adaptar'); return }
      setAdaptation(data.adaptation)
    } catch {
      setError('Error de conexión — intentá de nuevo')
    } finally {
      setAdapting(false)
    }
  }

  const transcribeAndAdapt = async (angle?: string) => {
    setError('')
    setTranscribing(true)
    try {
      const res = await fetch('/api/competitors/reels/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reelId: reel.id }),
      })
      const data = await res.json()
      if (!res.ok || data.error) { setError(data.error || 'Error al transcribir'); return }
      setTranscript(data.transcript)
    } catch {
      setError('Error de conexión — intentá de nuevo')
      setTranscribing(false)
      return
    } finally {
      setTranscribing(false)
    }
    await adapt(angle)
  }

  const busy = transcribing || adapting

  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em' }}>ADAPTÁ ESTE REEL A TU NICHO</div>
        {transcript && <span style={{ fontSize: 11, background: 'var(--success-bg)', color: 'var(--success)', padding: '3px 8px', borderRadius: 6, fontWeight: 600 }}>Transcripto ✓</span>}
      </div>
      <p style={{ fontSize: 12, color: 'var(--text-faint)', marginBottom: 16 }}>
        {transcript
          ? 'Ya tenemos la transcripción del audio — las adaptaciones usan el contenido real hablado.'
          : 'Gratis: adaptamos con el caption. PRO: transcribimos el audio primero para un resultado más preciso (tiene un costo chico de transcripción).'}
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
        {ANGLES.map(angle => (
          <button key={angle} onClick={() => adapt(angle)} disabled={busy} className="btn btn-ghost" style={{ fontSize: 12, padding: '7px 12px' }}>
            {angle}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <input
          value={customAngle}
          onChange={e => setCustomAngle(e.target.value)}
          placeholder="O escribí un ángulo personalizado..."
          style={{ flex: 1, fontSize: 13 }}
        />
        <button onClick={() => adapt(customAngle)} disabled={busy || !customAngle.trim()} className="btn btn-ghost" style={{ fontSize: 13 }}>
          {adapting && !transcribing ? '⏳' : '⚡ Adaptar gratis'}
        </button>
        {!transcript && (
          <button onClick={() => transcribeAndAdapt(customAngle)} disabled={busy} className="btn btn-primary" style={{ fontSize: 13, whiteSpace: 'nowrap' }}>
            {transcribing ? '⏳ Transcribiendo...' : '✨ Adaptar PRO'}
          </button>
        )}
      </div>

      {error && (
        <div style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--danger)', marginBottom: 14 }}>
          {error}
        </div>
      )}

      {adaptation && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700 }}>Guión adaptado</span>
            <button onClick={() => navigator.clipboard.writeText(adaptation)} className="btn btn-ghost" style={{ fontSize: 12, padding: '5px 10px' }}>📋 Copiar</button>
          </div>
          <div style={{ fontSize: 13.5, lineHeight: 1.9, color: 'var(--text)', background: 'var(--surface-2)', borderRadius: 10, padding: 16, whiteSpace: 'pre-wrap', maxHeight: 400, overflowY: 'auto' }}>
            {adaptation}
          </div>
        </div>
      )}

      {transcript && (
        <details style={{ marginTop: 14 }}>
          <summary style={{ fontSize: 12, color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 600 }}>Ver transcripción</summary>
          <div style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--text-muted)', marginTop: 8, whiteSpace: 'pre-wrap' }}>{transcript}</div>
        </details>
      )}
    </div>
  )
}
