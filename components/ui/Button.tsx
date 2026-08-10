'use client'
import { forwardRef } from 'react'
import type { ButtonHTMLAttributes, CSSProperties } from 'react'
import type { LucideIcon } from './icons'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  leftIcon?: LucideIcon
  rightIcon?: LucideIcon
}

const SIZE: Record<ButtonSize, { padding: string; fontSize: number; iconSize: number; gap: number }> = {
  xs: { padding: '4px 10px', fontSize: 12, iconSize: 13, gap: 5 },
  sm: { padding: '6px 12px', fontSize: 13, iconSize: 14, gap: 6 },
  md: { padding: '9px 16px', fontSize: 13.5, iconSize: 16, gap: 7 },
  lg: { padding: '11px 20px', fontSize: 15, iconSize: 18, gap: 8 },
}

const VARIANT: Record<ButtonVariant, CSSProperties> = {
  primary: { background: 'var(--primary)', color: 'var(--primary-text)', border: '1px solid transparent' },
  secondary: { background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border)' },
  ghost: { background: 'transparent', color: 'var(--text-muted)', border: '1px solid transparent' },
  danger: { background: 'var(--danger)', color: '#fff', border: '1px solid transparent' },
  outline: { background: 'transparent', color: 'var(--primary)', border: '1px solid var(--border-strong)' },
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled,
    leftIcon: LeftIcon,
    rightIcon: RightIcon,
    className = '',
    style,
    children,
    ...rest
  },
  ref,
) {
  const s = SIZE[size]
  const isDisabled = disabled || loading

  return (
    <button
      ref={ref}
      disabled={isDisabled}
      className={`ui-btn ui-btn-${variant} ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: s.gap,
        padding: s.padding,
        fontSize: s.fontSize,
        fontWeight: 600,
        borderRadius: 'var(--radius)',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.6 : 1,
        transition: 'filter var(--transition-fast), box-shadow var(--transition-fast), border-color var(--transition-fast), background var(--transition-fast)',
        ...VARIANT[variant],
        ...style,
      }}
      {...rest}
    >
      {loading ? (
        <span
          style={{
            width: s.iconSize,
            height: s.iconSize,
            borderRadius: '50%',
            border: '2px solid currentColor',
            borderTopColor: 'transparent',
            opacity: 0.7,
            animation: 'ui-spin 0.6s linear infinite',
            flexShrink: 0,
          }}
        />
      ) : (
        LeftIcon && <LeftIcon size={s.iconSize} strokeWidth={2} style={{ flexShrink: 0 }} />
      )}
      {children}
      {!loading && RightIcon && <RightIcon size={s.iconSize} strokeWidth={2} style={{ flexShrink: 0 }} />}
    </button>
  )
})

export default Button
