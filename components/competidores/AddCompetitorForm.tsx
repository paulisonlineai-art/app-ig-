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
        style={{ flex: 1 }}
      />
      <button type="submit" disabled={loading || !username.trim()} className="btn btn-primary" style={{ padding: '12px 20px', fontSize: 14 }}>
        {loading ? 'Agregando...' : '+ Agregar'}
      </button>
      {error && <p style={{ color: 'var(--danger)', fontSize: 13, alignSelf: 'center' }}>{error}</p>}
    </form>
  )
}
