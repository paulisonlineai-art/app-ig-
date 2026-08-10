'use client'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import SidebarBody, { type NavItem, type NavSection } from './dashboard/SidebarBody'

interface Props {
  accountId: string
  username?: string
  followersCount?: number
  sections: NavSection[]
  bottomItems: NavItem[]
}

export default function MobileNav({ accountId, username, followersCount, sections, bottomItems }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        className="mobile-menu-btn"
        onClick={() => setOpen(true)}
        aria-label="Abrir menú de navegación"
      >
        <Menu size={22} />
      </button>

      <div className={`mobile-nav-panel${open ? ' open' : ''}`}>
        <button className="mobile-nav-close" onClick={() => setOpen(false)} aria-label="Cerrar menú">
          <X size={22} />
        </button>
        <div className="mobile-nav-body" onClick={() => setOpen(false)}>
          <SidebarBody
            accountId={accountId}
            username={username}
            followersCount={followersCount}
            sections={sections}
            bottomItems={bottomItems}
          />
        </div>
      </div>
    </>
  )
}
