'use client'
import { useState } from 'react'

export default function ProfileAvatar({ url, accountId, type, username, size = 36, border }: {
  url?: string | null
  accountId?: string
  type?: 'account' | 'competitor'
  username?: string
  size?: number
  border?: string
}) {
  const [failed, setFailed] = useState(false)
  const initials = (username || '?')[0].toUpperCase()

  const src = accountId
    ? `/api/profile-pic?id=${accountId}&type=${type || 'account'}`
    : url
      ? `/api/proxy-image?url=${encodeURIComponent(url)}`
      : null

  if (!src || failed) {
    return (
      <div style={{
        width: size, height: size, borderRadius: '50%',
        background: 'var(--accent-light)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.4, fontWeight: 700, color: 'var(--accent)',
        border: border || undefined, flexShrink: 0,
      }}>
        {initials}
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={username ? `@${username}` : 'Foto de perfil'}
      onError={() => setFailed(true)}
      style={{
        width: size, height: size, borderRadius: '50%',
        objectFit: 'cover', border: border || undefined, flexShrink: 0,
      }}
    />
  )
}
