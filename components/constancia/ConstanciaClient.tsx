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
          <button
            onClick={() => setMonthOffset(p => p - 1)}
            style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 14px', fontSize: 13, cursor: 'pointer', color: 'var(--text)' }}
          >
            ←
          </button>
          <span style={{ fontSize: 16, fontWeight: 700, textTransform: 'capitalize' }}>{monthName}</span>
          <button
            onClick={() => setMonthOffset(p => p + 1)}
            disabled={!canGoForward}
            style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 14px', fontSize: 13, cursor: canGoForward ? 'pointer' : 'not-allowed', opacity: canGoForward ? 1 : 0.3, color: 'var(--text)' }}
          >
            →
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, textAlign: 'center' }}>
          {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(d => (
            <div key={d} style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-faint)', padding: '4px 0', letterSpacing: '0.05em' }}>
              {d}
            </div>
          ))}

          {cells.map((cell, i) => {
            if (!cell) return <div key={`empty-${i}`} />

            const isToday = cell.key === todayKey
            const hasContent = !!cell.data
            const isFuture = new Date(cell.key) > today

            return (
              <div
                key={cell.key}
                title={hasContent ? `${cell.data!.reels} reel(s), ${cell.data!.stories} historia(s)` : undefined}
                style={{
                  aspectRatio: '1',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: hasContent ? 700 : 400,
                  position: 'relative',
                  background: hasContent
                    ? 'var(--accent)'
                    : isToday
                      ? 'var(--surface-2)'
                      : 'transparent',
                  color: hasContent
                    ? 'white'
                    : isFuture
                      ? 'var(--text-faint)'
                      : 'var(--text)',
                  border: isToday && !hasContent ? '2px solid var(--accent)' : '2px solid transparent',
                  cursor: hasContent ? 'default' : 'default',
                }}
              >
                {cell.day}
                {hasContent && cell.data!.reels > 1 && (
                  <span style={{ fontSize: 9, fontWeight: 600, opacity: 0.8 }}>
                    x{cell.data!.reels}
                  </span>
                )}
              </div>
            )
          })}
        </div>

        <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginTop: 20, fontSize: 12, color: 'var(--text-muted)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 12, height: 12, borderRadius: 4, background: 'var(--accent)' }} />
            <span>Publicaste</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 12, height: 12, borderRadius: 4, border: '2px solid var(--accent)', background: 'transparent' }} />
            <span>Hoy</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 12, height: 12, borderRadius: 4, background: 'var(--surface-2)' }} />
            <span>Sin publicar</span>
          </div>
        </div>
      </div>
    </div>
  )
}
