'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ICON_MAP } from './ui/icons'

interface Props {
  href: string
  label: string
  icon: string
  collapsed?: boolean
}

export default function NavLink({ href, label, icon, collapsed = false }: Props) {
  const pathname = usePathname()
  const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
  const IconComponent = ICON_MAP[icon]

  return (
    <Link href={href} className={`nav-link${active ? ' active' : ''}`} title={collapsed ? label : undefined}>
      {IconComponent && (
        <IconComponent size={18} strokeWidth={1.75} className="nav-link-icon" data-active={active || undefined} />
      )}
      {!collapsed && <span className="nav-link-label">{label}</span>}
    </Link>
  )
}
