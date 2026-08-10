'use client'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid, Cell } from 'recharts'

interface ReelData { like_rate: number; comment_rate: number }
interface Averages { avg_like_rate: number; avg_comment_rate: number }

export default function BenchmarkChart({ reel, avgs }: { reel: ReelData; avgs: Averages }) {
  const data = [
    { name: 'Likes', actual: reel.like_rate, bench: avgs.avg_like_rate },
    { name: 'Comments', actual: reel.comment_rate, bench: avgs.avg_comment_rate },
  ]

  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: 4 }}>INTERACCIONES VS BENCHMARK</div>
      <div style={{ fontSize: 11, color: 'var(--text-faint)', marginBottom: 16 }}>% sobre views totales vs promedio 90d</div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--primary)' }} />
          <span style={{ color: 'var(--text-muted)' }}>Reel</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
          <div style={{ width: 14, height: 2, borderTop: '2px dashed var(--text-faint)' }} />
          <span style={{ color: 'var(--text-muted)' }}>Bench</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} barGap={4}>
          <CartesianGrid vertical={false} stroke="var(--border)" strokeOpacity={0.5} />
          <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis tickFormatter={v => `${v.toFixed(1)}%`} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickLine={false} axisLine={false} width={36} />
          <Tooltip
            contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12, color: 'var(--text)', boxShadow: 'var(--shadow-sm)', padding: '8px 12px' }}
            cursor={{ fill: 'var(--surface-2)' }}
            formatter={(v) => [`${Number(v).toFixed(2)}%`]}
          />
          <Bar dataKey="actual" radius={[4, 4, 0, 0]} maxBarSize={40}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.actual >= entry.bench ? 'var(--success)' : 'var(--danger)'} />
            ))}
          </Bar>
          {data.map((d, i) => (
            <ReferenceLine key={i} x={d.name} y={d.bench} stroke="var(--text-faint)" strokeDasharray="3 3" />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
