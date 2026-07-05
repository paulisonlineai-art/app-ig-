'use client'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts'

export default function BenchmarkChart({ reel, avgs }: { reel: any; avgs: any }) {
  const data = [
    { name: 'Likes', actual: reel.like_rate, bench: avgs.avg_like_rate },
    { name: 'Saves', actual: reel.save_rate, bench: avgs.avg_save_rate },
    { name: 'Comments', actual: reel.comment_rate, bench: avgs.avg_comment_rate },
    { name: 'Shares', actual: reel.share_rate, bench: avgs.avg_share_rate },
  ]

  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: 4 }}>INTERACCIONES VS BENCHMARK</div>
      <div style={{ fontSize: 11, color: 'var(--text-faint)', marginBottom: 16 }}>% sobre views totales vs promedio 90d</div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: '#7c3aed' }} />
          <span style={{ color: 'var(--text-muted)' }}>Reel</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
          <div style={{ width: 14, height: 2, background: '#9999b3', borderTop: '2px dashed #9999b3' }} />
          <span style={{ color: 'var(--text-muted)' }}>Bench</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} barGap={4}>
          <XAxis dataKey="name" tick={{ fill: '#9999b3', fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis tickFormatter={v => `${v.toFixed(1)}%`} tick={{ fill: '#9999b3', fontSize: 10 }} tickLine={false} axisLine={false} width={36} />
          <Tooltip
            contentStyle={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
            formatter={(v: any) => [`${Number(v).toFixed(2)}%`]}
          />
          <Bar dataKey="actual" fill="#7c3aed" radius={[4, 4, 0, 0]} maxBarSize={40}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.actual >= entry.bench ? '#7c3aed' : '#a78bfa'} />
            ))}
          </Bar>
          {data.map((d, i) => (
            <ReferenceLine key={i} x={d.name} y={d.bench} stroke="#9999b3" strokeDasharray="3 3" />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
