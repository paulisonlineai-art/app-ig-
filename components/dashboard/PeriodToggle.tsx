'use client'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'

const DEFAULT_PERIODS = [
  { value: '7d', label: '7d' },
  { value: '30d', label: '30d' },
  { value: '90d', label: '90d' },
]

interface Props {
  current: string
  options?: { value: string; label: string }[]
  paramName?: string
  label?: string
}

export default function PeriodToggle({ current, options = DEFAULT_PERIODS, paramName = 'range', label = 'Período' }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const onChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set(paramName, value)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="period-toggle" role="group" aria-label={label}>
      {options.map((p) => (
        <button
          key={p.value}
          onClick={() => onChange(p.value)}
          className={`period-toggle-btn${current === p.value ? ' active' : ''}`}
        >
          {p.label}
        </button>
      ))}
    </div>
  )
}
