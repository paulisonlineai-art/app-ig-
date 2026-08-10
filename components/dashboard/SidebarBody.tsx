import ProfileAvatar from '../ProfileAvatar'
import LogoutButton from '../LogoutButton'
import NavLink from '../NavLink'
import { formatNumber } from '@/lib/utils'

export interface NavItem {
  href: string
  label: string
  icon: string
}

export interface NavSection {
  label: string | null
  items: NavItem[]
}

interface Props {
  accountId: string
  username?: string
  followersCount?: number
  sections: NavSection[]
  bottomItems: NavItem[]
  collapsed?: boolean
}

export default function SidebarBody({ accountId, username, followersCount, sections, bottomItems, collapsed = false }: Props) {
  return (
    <>
      <div className="sidebar-profile">
        <div className="sidebar-profile-inner">
          <ProfileAvatar accountId={accountId} username={username} size={collapsed ? 32 : 36} border="2px solid var(--primary-light)" />
          {!collapsed && (
            <div style={{ minWidth: 0 }}>
              <div className="sidebar-username">@{username || 'cuenta'}</div>
              <div className="sidebar-followers">
                {followersCount ? `${formatNumber(followersCount)} seguidores` : 'Klar'}
              </div>
            </div>
          )}
        </div>
      </div>

      <nav className="sidebar-nav" aria-label="Navegación principal">
        {sections.map((section, i) => (
          <div key={section.label ?? `section-${i}`}>
            {section.label && !collapsed && <div className="sidebar-section-label">{section.label}</div>}
            {section.items.map((item) => (
              <NavLink key={item.href} {...item} collapsed={collapsed} />
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-bottom">
        {bottomItems.map((item) => (
          <NavLink key={item.href} {...item} collapsed={collapsed} />
        ))}
        <LogoutButton collapsed={collapsed} />
      </div>
    </>
  )
}
