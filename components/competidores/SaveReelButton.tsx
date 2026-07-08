'use client'
import { useState } from 'react'

export default function SaveReelButton({ reelId, initialSaved }: { reelId: string; initialSaved: boolean }) {
  const [saved, setSaved] = useState(initialSaved)
  const [loading, setLoading] = useState(false)

  const toggle = async () => {
    const next = !saved
    setSaved(next)
    setLoading(true)
    try {
      const res = await fetch('/api/competitors/reels/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reelId, saved: next }),
      })
      if (!res.ok) setSaved(!next)
    } catch {
      setSaved(!next)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className="btn btn-ghost"
      style={{ fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}
    >
      <span>{saved ? '⭐' : '☆'}</span>
      {saved ? 'Guardado' : 'Guardar para más adelante'}
    </button>
  )
}
