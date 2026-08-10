'use client'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer, CartesianGrid, Cell } from 'recharts'
import type { Reel } from '@/types'
import { formatNumber } from '@/lib/utils'

export default function ReelsChart({ reels }: { reels: Reel[] }) {
  const sorted = [...reels].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  const avgViews = sorted.length ? sorted.reduce((s, r) => s + r.views, 0) / sorted.length : 0

  const data = sorted.map(r => ({
    name: new Date(r.timestamp).toLocaleDateString('es', { month: 'short', day: 'numeric' }),
    views: r.views,
    aboveAvg: r.views >= avgViews,
    id: r.id,
  }))

  const axisTickProps = { fill: 'var(--text-faint)', fontSize: 10 }

  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" strokeOpacity={0.5} />
        <XAxis dataKey="name" tick={axisTickProps} tickLine={false} axisLine={false} interval="preserveStartEnd" />
        <YAxis tickFormatter={formatNumber} tick={axisTickProps} tickLine={false} axisLine={false} width={36} />
        <Tooltip
          contentStyle={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            fontSize: 12,
            color: 'var(--text)',
            boxShadow: 'var(--shadow-sm)',
            padding: '8px 12px',
          }}
          cursor={{ fill: 'var(--surface-2)' }}
          formatter={(v) => [formatNumber(Number(v) || 0), 'Vistas']}
        />
        <ReferenceLine y={avgViews} stroke="var(--primary)" strokeDasharray="4 4" label={{ value: 'Promedio', fill: 'var(--primary)', fontSize: 11, position: 'right' }} />
        <Bar dataKey="views" radius={[4, 4, 0, 0]} maxBarSize={28}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.aboveAvg ? 'var(--primary)' : 'var(--surface-3)'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
