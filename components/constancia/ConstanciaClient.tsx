'use client'

import { useState } from 'react'

type DayData = { reels: number; stories: number; views: number }

export default function ConstanciaClient({ publishDates }: { publishDates: Record<string, DayData> }) {
  const today = new Date()
  const [monthOffset, setMonthOffset] = useState(0)

  const viewDate = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1)
  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const monthName = viewDate.toLocaleDateString('es', { month: 'long', year: 'numeric' })

  const cells: (null | { day: number; key: string; data?: DayData })[] = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) {
    const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    cells.push({ day: d, key, data: publishDates[key] })
  }

  const todayKey = today.toISOString().split('T')[0]
  const canGoForward = monthOffset < 0

  return (
    <div>
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <button onClick={() => setMonthOffset(p => p - 1)} className="btn btn-ghost">←</button>
          <span style={{ fontSize: 16, fontWeight: 700, textTransform: 'capitalize' }}>{monthName}</span>
          <button onClick={() => setMonthOffset(p => p + 1)} disabled={!canGoForward} className="btn btn-ghost" style={{ opacity: canGoForward ? 1 : 0.3 }}>→</button>
        </div>

        <div className="calendar-grid">
          {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(d => (
            <div key={d} className="calendar-day-label">{d}</div>
          ))}

          {cells.map((cell, i) => {
            if (!cell) return <div key={`empty-${i}`} />

            const isToday = cell.key === todayKey
            const hasContent = !!cell.data
            const isFuture = new Date(cell.key) > today

            const cls = [
              'calendar-cell',
              hasContent ? 'calendar-cell-active' : '',
              isToday && !hasContent ? 'calendar-cell-today' : '',
              isFuture && !hasContent ? 'calendar-cell-future' : '',
            ].filter(Boolean).join(' ')

            return (
              <div
                key={cell.key}
                className={cls}
                title={hasContent ? `${cell.data!.reels} reel(s), ${cell.data!.stories} historia(s)` : undefined}
              >
                {cell.day}
                {hasContent && cell.data!.reels > 1 && (
                  <span className="calendar-cell-multiplier">x{cell.data!.reels}</span>
                )}
              </div>
            )
          })}
        </div>

        <div className="calendar-legend">
          <div className="calendar-legend-item">
            <div className="calendar-legend-dot" style={{ background: 'var(--accent)' }} />
            <span>Publicaste</span>
          </div>
          <div className="calendar-legend-item">
            <div className="calendar-legend-dot" style={{ border: '2px solid var(--accent)', background: 'transparent' }} />
            <span>Hoy</span>
          </div>
          <div className="calendar-legend-item">
            <div className="calendar-legend-dot" style={{ background: 'var(--surface-2)' }} />
            <span>Sin publicar</span>
          </div>
        </div>
      </div>
    </div>
  )
}
