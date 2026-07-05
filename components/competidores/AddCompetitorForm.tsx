'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AddCompetitorForm({ accountId }: { accountId: string }) {
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim()) return
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/competitors/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.replace('@', '').trim() }),
      })
      const data = await res.json()
      if (data.error) setError(data.error)
      else {
        setUsername('')
        router.refresh()
      }
    } catch {
      setError('Error al agregar competidor')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} style={{ display: 'flex', gap: 12, maxWidth: 480 }}>
      <input
        value={username}
        onChange={e => setUsername(e.target.value)}
        placeholder="@username del competidor"
        style={{
          flex: 1,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          padding: '12px 16px',
          color: 'var(--text)',
          fontSize: 14,
          outline: 'none',
        }}
      />
      <button
        type="submit"
        disabled={loading || !username.trim()}
        style={{
          background: 'var(--accent)',
          color: 'white',
          border: 'none',
          padding: '12px 20px',
          borderRadius: 10,
          fontWeight: 600,
          fontSize: 14,
          cursor: loading ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? 'Agregando...' : '+ Agregar'}
      </button>
      {error && <p style={{ color: 'var(--danger)', fontSize: 13, alignSelf: 'center' }}>{error}</p>}
    </form>
  )
}
