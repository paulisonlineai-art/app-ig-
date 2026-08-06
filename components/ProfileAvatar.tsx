'use client'
import { useState } from 'react'

interface Props {
  url?: string | null
  accountId?: string
  type?: 'account' | 'competitor'
  username?: string
  size?: number
  border?: string
}

export default function ProfileAvatar({ url, accountId, type, username, size = 36, border }: Props) {
  const [failed, setFailed] = useState(false)
  const initials = (username || '?')[0].toUpperCase()

  const src = accountId
    ? `/api/profile-pic?id=${accountId}&type=${type || 'account'}`
    : url
      ? `/api/proxy-image?url=${encodeURIComponent(url)}`
      : null

  const baseStyle = {
    width: size,
    height: size,
    borderRadius: '50%',
    border: border || undefined,
    flexShrink: 0 as const,
  }

  if (!src || failed) {
    return (
      <div style={{
        ...baseStyle,
        background: 'var(--accent-light)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.4, fontWeight: 700, color: 'var(--accent)',
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
      style={{ ...baseStyle, objectFit: 'cover' }}
    />
  )
}
