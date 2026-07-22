'use client'
import { useState } from 'react'

const TABS = [
  { id: 'ideas', label: 'Ideas IA', icon: '🤖' },
  { id: 'lab', label: 'Laboratorio', icon: '🧪' },
  { id: 'pipeline', label: 'Pipeline', icon: '📋' },
] as const

type TabId = typeof TABS[number]['id']

export default function CrearTabs({ children }: { children: Record<string, React.ReactNode> }) {
  const [active, setActive] = useState<TabId>('ideas')

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 24, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '10px 16px',
              fontSize: 13, fontWeight: active === tab.id ? 700 : 500,
              color: active === tab.id ? 'var(--accent)' : 'var(--text-muted)',
              background: 'none', border: 'none', cursor: 'pointer',
              borderBottom: active === tab.id ? '2px solid var(--accent)' : '2px solid transparent',
              marginBottom: -1,
              transition: 'all 0.15s',
            }}
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
