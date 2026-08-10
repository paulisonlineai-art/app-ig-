import type { CSSProperties } from 'react'
import type { LucideIcon } from './icons'

interface IconProps {
  icon: LucideIcon
  size?: number
  strokeWidth?: number
  color?: string
  className?: string
  style?: CSSProperties
}

/** Consistent wrapper around Lucide icons — fixes default size/stroke so icons read as one system. */
export default function Icon({ icon: IconComponent, size = 18, strokeWidth = 1.75, color, className, style }: IconProps) {
  return <IconComponent size={size} strokeWidth={strokeWidth} color={color} className={className} style={style} />
}
