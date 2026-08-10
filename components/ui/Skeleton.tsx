import type { CSSProperties } from 'react'

type SkeletonVariant = 'text' | 'card' | 'chart' | 'table-row' | 'avatar' | 'badge'

interface SkeletonProps {
  variant?: SkeletonVariant
  width?: string | number
  height?: string | number
  className?: string
  style?: CSSProperties
}

const DEFAULTS: Record<SkeletonVariant, { width: string | number; height: string | number; borderRadius: string | number }> = {
  text: { width: '100%', height: 14, borderRadius: 4 },
  card: { width: '100%', height: 120, borderRadius: 'var(--radius-lg)' },
  chart: { width: '100%', height: 220, borderRadius: 'var(--radius-lg)' },
  'table-row': { width: '100%', height: 40, borderRadius: 6 },
  avatar: { width: 36, height: 36, borderRadius: '50%' },
  badge: { width: 60, height: 20, borderRadius: 20 },
}

export default function Skeleton({ variant = 'text', width, height, className = '', style }: SkeletonProps) {
  const d = DEFAULTS[variant]
  return (
    <div
      className={`ui-skeleton ${className}`}
      style={{
        width: width ?? d.width,
        height: height ?? d.height,
        borderRadius: d.borderRadius,
        ...style,
      }}
    />
  )
}
