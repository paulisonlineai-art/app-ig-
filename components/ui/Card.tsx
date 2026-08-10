import type { CSSProperties, MouseEventHandler, ReactNode } from 'react'

type CardVariant = 'default' | 'elevated' | 'interactive' | 'ghost'
type CardPadding = 'none' | 'sm' | 'md' | 'lg'

interface CardProps {
  variant?: CardVariant
  padding?: CardPadding
  className?: string
  style?: CSSProperties
  onClick?: MouseEventHandler<HTMLDivElement>
  children: ReactNode
}

const PADDING: Record<CardPadding, number> = {
  none: 0,
  sm: 12,
  md: 20,
  lg: 28,
}

export default function Card({ variant = 'default', padding = 'md', className = '', style, onClick, children }: CardProps) {
  return (
    <div
      className={`ui-card ui-card-${variant} ${className}`}
      onClick={onClick}
      style={{
        background: variant === 'ghost' ? 'transparent' : 'var(--surface)',
        border: variant === 'ghost' ? '1px dashed var(--border-strong)' : '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: PADDING[padding],
        boxShadow: variant === 'default' ? 'var(--shadow-xs)' : 'none',
        cursor: onClick || variant === 'interactive' ? 'pointer' : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  )
}
