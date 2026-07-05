'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function NavLink({ href, label, icon }: { href: string; label: string; icon: string }) {
  const pathname = usePathname()
  const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))

  return (
    <Link
      href={href}
      className={`nav-link${active ? ' active' : ''}`}
      style={{ marginBottom: 2 }}
    >
      <span style={{ fontSize: 15, width: 20, textAlign: 'center', opacity: active ? 1 : 0.6 }}>{icon}</span>
      {label}
    </Link>
  )
}
