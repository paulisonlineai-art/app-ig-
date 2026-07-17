import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString()
}

export function formatCurrency(n: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(n)
}

export function calcMultiplier(views: number, avgViews: number): number {
  if (!avgViews) return 1
  return views / avgViews
}

export function calcRate(metric: number, views: number): number {
  if (!views) return 0
  return (metric / views) * 100
}

export const DATE_RANGE_OPTIONS = [
  { value: 'today', label: 'Hoy' },
  { value: 'yesterday', label: 'Ayer' },
  { value: '7d', label: 'Últimos 7 días' },
  { value: '30d', label: 'Últimos 30 días' },
  { value: '90d', label: 'Últimos 90 días' },
  { value: 'month', label: 'Este mes' },
  { value: 'all', label: 'Todo el tiempo' },
] as const

export type DateRangeValue = typeof DATE_RANGE_OPTIONS[number]['value']

// Bounds for the selected range plus the immediately-preceding window of the
// same length, used for "vs período anterior" comparisons. `start`/`prevStart`
// are null for "all" (no lower bound, no meaningful previous period).
export function getRangeBounds(range: string): { start: Date | null; end: Date | null; prevStart: Date | null; prevEnd: Date | null } {
  const now = new Date()
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const today = startOfDay(now)
  const daysAgo = (n: number) => new Date(now.getTime() - n * 864e5)

  switch (range) {
    case 'today':
      return { start: today, end: null, prevStart: daysAgo(1), prevEnd: today }
    case 'yesterday': {
      const yStart = daysAgo(1)
      return { start: yStart, end: today, prevStart: daysAgo(2), prevEnd: yStart }
    }
    case '7d':
      return { start: daysAgo(7), end: null, prevStart: daysAgo(14), prevEnd: daysAgo(7) }
    case '90d':
      return { start: daysAgo(90), end: null, prevStart: daysAgo(180), prevEnd: daysAgo(90) }
    case 'month': {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      return { start: monthStart, end: null, prevStart: prevMonthStart, prevEnd: monthStart }
    }
    case 'all':
      return { start: null, end: null, prevStart: null, prevEnd: null }
    case '30d':
    default:
      return { start: daysAgo(30), end: null, prevStart: daysAgo(60), prevEnd: daysAgo(30) }
  }
}

export function calcAverages(reels: { views: number; like_rate: number; comment_rate: number; words_per_minute: number | null }[]) {
  if (!reels.length) return { avg_views: 0, avg_like_rate: 0, avg_comment_rate: 0, avg_wpm: 0 }
  const n = reels.length
  return {
    avg_views: reels.reduce((s, r) => s + r.views, 0) / n,
    avg_like_rate: reels.reduce((s, r) => s + r.like_rate, 0) / n,
    avg_comment_rate: reels.reduce((s, r) => s + r.comment_rate, 0) / n,
    avg_wpm: reels.filter(r => r.words_per_minute).reduce((s, r) => s + (r.words_per_minute ?? 0), 0) / (reels.filter(r => r.words_per_minute).length || 1),
  }
}
