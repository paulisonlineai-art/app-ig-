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

export function calcAverages(reels: { views: number; like_rate: number; save_rate: number; comment_rate: number; share_rate: number; words_per_minute: number | null }[]) {
  if (!reels.length) return { avg_views: 0, avg_like_rate: 0, avg_save_rate: 0, avg_comment_rate: 0, avg_share_rate: 0, avg_wpm: 0 }
  const n = reels.length
  return {
    avg_views: reels.reduce((s, r) => s + r.views, 0) / n,
    avg_like_rate: reels.reduce((s, r) => s + r.like_rate, 0) / n,
    avg_save_rate: reels.reduce((s, r) => s + r.save_rate, 0) / n,
    avg_comment_rate: reels.reduce((s, r) => s + r.comment_rate, 0) / n,
    avg_share_rate: reels.reduce((s, r) => s + r.share_rate, 0) / n,
    avg_wpm: reels.filter(r => r.words_per_minute).reduce((s, r) => s + (r.words_per_minute ?? 0), 0) / (reels.filter(r => r.words_per_minute).length || 1),
  }
}
