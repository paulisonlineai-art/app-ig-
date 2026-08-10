'use client'
import { useEffect, useState } from 'react'
import { ChevronLeft } from 'lucide-react'
import SidebarBody, { type NavItem, type NavSection } from './SidebarBody'

const STORAGE_KEY = 'klar_sidebar_collapsed'

interface Props {
  accountId: string
  username?: string
  followersCount?: number
  sections: NavSection[]
  bottomItems: NavItem[]
}

export default function Sidebar(props: Props) {
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY) === '1') setCollapsed(true)
  }, [])

  const toggle = () => {
    setCollapsed((prev) => {
      const next = !prev
      localStorage.setItem(STORAGE_KEY, next ? '1' : '0')
      return next
    })
  }

  return (
    <aside className={`dashboard-sidebar${collapsed ? ' sidebar-collapsed' : ''}`}>
      <SidebarBody {...props} collapsed={collapsed} />
      <button
        className="sidebar-collapse-btn"
        onClick={toggle}
        aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
        title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
      >
        <ChevronLeft size={16} className="sidebar-collapse-icon" />
        {!collapsed && <span>Colapsar</span>}
      </button>
    </aside>
  )
}
