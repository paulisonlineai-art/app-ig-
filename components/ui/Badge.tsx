import type { CSSProperties, ReactNode } from 'react'

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger'
type BadgeSize = 'sm' | 'md'

interface BadgeProps {
  variant?: BadgeVariant
  size?: BadgeSize
  dot?: boolean
  className?: string
  children: ReactNode
}

const COLORS: Record<BadgeVariant, { bg: string; text: string }> = {
  default: { bg: 'var(--surface-2)', text: 'var(--text-muted)' },
  primary: { bg: 'var(--primary-light)', text: 'var(--primary)' },
  success: { bg: 'var(--success-bg)', text: 'var(--success)' },
  warning: { bg: 'var(--warning-bg)', text: 'var(--warning)' },
  danger: { bg: 'var(--danger-bg)', text: 'var(--danger)' },
}

const SIZE: Record<BadgeSize, CSSProperties> = {
  sm: { fontSize: 11, padding: '2px 8px', gap: 4 },
  md: { fontSize: 12, padding: '4px 10px', gap: 6 },
}

export default function Badge({ variant = 'default', size = 'sm', dot = false, className = '', children }: BadgeProps) {
  const { bg, text } = COLORS[variant]
  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        ...SIZE[size],
        background: bg,
        color: text,
        borderRadius: 'var(--radius-sm)',
        fontWeight: 600,
        lineHeight: 1.4,
        whiteSpace: 'nowrap',
      }}
    >
      {dot && (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: text,
            flexShrink: 0,
          }}
        />
      )}
      {children}
    </span>
  )
}
