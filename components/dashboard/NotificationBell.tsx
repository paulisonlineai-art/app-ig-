'use client'
import { Bell } from 'lucide-react'

export default function NotificationBell() {
  return (
    <button className="topbar-icon-btn" aria-label="Notificaciones" title="Notificaciones — Próximamente">
      <Bell size={18} strokeWidth={1.75} />
    </button>
  )
}
