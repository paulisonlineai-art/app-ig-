'use client'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { DATE_RANGE_OPTIONS } from '@/lib/utils'

export default function DateRangeSelect({ current }: { current: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const onChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('range', value)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <select value={current} onChange={e => onChange(e.target.value)} style={{ fontSize: 13, padding: '7px 12px', borderRadius: 8 }}>
      {DATE_RANGE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}
