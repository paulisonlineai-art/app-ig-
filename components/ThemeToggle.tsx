'use client'

import { useState, useEffect } from 'react'

type ThemeMode = 'light' | 'dark' | 'auto'

const STORAGE_KEY = 'klar_theme'

function getAutoTheme(): 'light' | 'dark' {
  const hour = new Date().getHours()
  return hour >= 6 && hour < 18 ? 'light' : 'dark'
}

function applyTheme(mode: ThemeMode) {
  const resolved = mode === 'auto' ? getAutoTheme() : mode
  document.documentElement.setAttribute('data-theme', resolved)
}

export default function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>('auto')

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as ThemeMode | null
    const initial = saved || 'auto'
    setMode(initial)
    applyTheme(initial)

    if (initial === 'auto') {
      const interval = setInterval(() => applyTheme('auto'), 60_000)
      return () => clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    applyTheme(mode)
    localStorage.setItem(STORAGE_KEY, mode)

    if (mode === 'auto') {
      const interval = setInterval(() => applyTheme('auto'), 60_000)
      return () => clearInterval(interval)
    }
  }, [mode])

  const cycle = () => {
    setMode(prev => prev === 'light' ? 'dark' : prev === 'dark' ? 'auto' : 'light')
  }

  const icon = mode === 'light' ? '☀️' : mode === 'dark' ? '🌙' : '🌓'
  const label = mode === 'light' ? 'Claro' : mode === 'dark' ? 'Oscuro' : 'Auto'

  return (
    <button onClick={cycle} title={`Tema: ${label}`} className="theme-toggle">
      <span className="theme-toggle-icon">{icon}</span>
      {label}
    </button>
  )
}
