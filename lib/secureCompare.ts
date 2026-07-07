import { timingSafeEqual } from 'crypto'

// Plain !== on secrets leaks timing information proportional to how many
// leading characters match — a slow, noisy, but real side-channel for
// brute-forcing a webhook token.
export function secureCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
}
