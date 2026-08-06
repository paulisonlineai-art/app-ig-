'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function NavLink({ href, label, icon }: { href: string; label: string; icon: string }) {
  const pathname = usePathname()
  const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))

  return (
    <Link href={href} className={`nav-link${active ? ' active' : ''}`}>
      <span className="nav-link-icon" data-active={active || undefined}>{icon}</span>
      {label}
    </Link>
  )
}
