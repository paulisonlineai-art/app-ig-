'use client'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer, CartesianGrid, Cell } from 'recharts'

interface Metric {
  label: string
  value: number
  avg: number
}

export default function PerformanceVsAvg({ metrics }: { metrics: Metric[] }) {
  const data = metrics.map((m) => ({
    name: m.label,
    pct: m.avg > 0 ? Math.round((m.value / m.avg) * 100) : m.value > 0 ? 200 : 0,
  }))

  const axisTickProps = { fill: 'var(--text-faint)', fontSize: 10 }

  return (
    <ResponsiveContainer width="100%" height={140}>
      <BarChart data={data} layout="vertical" margin={{ left: 8 }}>
        <CartesianGrid horizontal={false} stroke="var(--border)" strokeOpacity={0.5} />
        <XAxis type="number" tick={axisTickProps} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
        <YAxis type="category" dataKey="name" tick={axisTickProps} tickLine={false} axisLine={false} width={70} />
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
          formatter={(v) => [`${v}% del promedio`, '']}
        />
        <ReferenceLine x={100} stroke="var(--text-faint)" strokeDasharray="4 4" />
        <Bar dataKey="pct" radius={[0, 4, 4, 0]} maxBarSize={16}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.pct >= 100 ? 'var(--success)' : 'var(--danger)'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
