'use client'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

/** Remounts on route change so the fade/slide-in CSS animation replays per page. */
export default function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  return (
    <div key={pathname} className="dashboard-content-inner">
      {children}
    </div>
  )
}
