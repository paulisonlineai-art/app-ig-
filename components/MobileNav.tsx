'use client'
import { useState } from 'react'

export default function MobileNav({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        className="mobile-menu-btn"
        onClick={() => setOpen(true)}
        aria-label="Abrir menú de navegación"
      >
        ☰
      </button>
      <aside className={`dashboard-sidebar mobile-sidebar ${open ? 'open' : ''}`}>
        <div onClick={() => setOpen(false)}>
          {children}
        </div>
      </aside>
      {open && (
        <div
          className="mobile-overlay"
          style={{ display: 'block' }}
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  )
}
