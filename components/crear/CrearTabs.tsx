'use client'
import { useState } from 'react'

const TABS = [
  { id: 'ideas', label: 'Ideas IA', icon: '🤖' },
  { id: 'hooks', label: 'Hooks', icon: '🪝' },
  { id: 'reciclar', label: 'Reciclar', icon: '♻️' },
] as const

type TabId = typeof TABS[number]['id']

export default function CrearTabs({ children }: { children: Record<string, React.ReactNode> }) {
  const [active, setActive] = useState<TabId>('ideas')

  return (
    <div>
      <div className="tab-bar" style={{ marginBottom: 24 }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={`tab-bar-item ${active === tab.id ? 'tab-bar-item-active' : ''}`}
          >
            <span style={{ fontSize: 14 }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>
      <div>{children[active]}</div>
    </div>
  )
}
