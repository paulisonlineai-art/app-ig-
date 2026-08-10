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
}

export default function PeriodToggle({ current, options = DEFAULT_PERIODS }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const onChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('range', value)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="period-toggle" role="group" aria-label="Período">
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
