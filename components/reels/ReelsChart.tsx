'use client'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer, Cell } from 'recharts'
import type { Reel } from '@/types'
import { formatNumber } from '@/lib/utils'

export default function ReelsChart({ reels }: { reels: Reel[] }) {
  const sorted = [...reels].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  const avgViews = sorted.reduce((s, r) => s + r.views, 0) / sorted.length

  const data = sorted.map(r => ({
    name: new Date(r.timestamp).toLocaleDateString('es', { month: 'short', day: 'numeric' }),
    views: r.views,
    isOutlier: r.views > avgViews,
    id: r.id,
  }))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <XAxis dataKey="name" tick={{ fill: '#888899', fontSize: 11 }} tickLine={false} axisLine={false} />
        <YAxis tickFormatter={formatNumber} tick={{ fill: '#888899', fontSize: 11 }} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{ background: '#12121a', border: '1px solid #2a2a3a', borderRadius: 8, fontSize: 13 }}
          formatter={(v) => [formatNumber(Number(v) || 0), 'Views']}
        />
        <ReferenceLine y={avgViews} stroke="#7c3aed" strokeDasharray="4 4" label={{ value: 'Promedio', fill: '#a78bfa', fontSize: 11, position: 'right' }} />
        <Bar dataKey="views" radius={[4, 4, 0, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.isOutlier ? '#7c3aed' : '#2a2a3a'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
