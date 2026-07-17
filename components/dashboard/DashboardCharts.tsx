'use client'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

export default function DashboardCharts({ audienceStats, reels }: { audienceStats: any[]; reels: any[] }) {
  const reachData = audienceStats.map(s => ({
    date: new Date(s.date).toLocaleDateString('es', { month: 'short', day: 'numeric' }),
    Alcance: s.reach,
    Impresiones: s.impressions,
  }))

  // Daily interactions from reels (group by date). Saves excluded — Instagram
  // never exposes that count publicly, so scraped data can't include it.
  const byDate: Record<string, { likes: number; comments: number }> = {}
  for (const r of reels) {
    const d = new Date(r.timestamp).toLocaleDateString('es', { month: 'short', day: 'numeric' })
    if (!byDate[d]) byDate[d] = { likes: 0, comments: 0 }
    byDate[d].likes += r.likes || 0
    byDate[d].comments += r.comments || 0
  }
  const interactData = Object.entries(byDate).map(([date, v]) => ({ date, ...v }))

  const tooltipStyle = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, color: 'var(--text)' }

  return (
    <div className="grid-detail-charts-2">
      <div className="card" style={{ padding: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Alcance & Visibilidad</div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
          {[{ color: '#7c3aed', label: 'Alcance' }, { color: '#a78bfa', label: 'Impresiones' }].map(l => (
            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-muted)' }}>
              <div style={{ width: 8, height: 2, background: l.color, borderRadius: 2 }} />
              {l.label}
            </div>
          ))}
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={reachData}>
            <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
            <YAxis hide />
            <Tooltip contentStyle={tooltipStyle} />
            <Line type="monotone" dataKey="Alcance" stroke="#7c3aed" dot={false} strokeWidth={2} />
            <Line type="monotone" dataKey="Impresiones" stroke="#a78bfa" dot={false} strokeWidth={1.5} strokeDasharray="4 4" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="card" style={{ padding: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Interacciones</div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
          {[{ color: '#7c3aed', label: 'Me gusta' }, { color: '#f59e0b', label: 'Comentarios' }].map(l => (
            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-muted)' }}>
              <div style={{ width: 8, height: 8, background: l.color, borderRadius: 2 }} />
              {l.label}
            </div>
          ))}
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={interactData}>
            <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
            <YAxis hide />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="likes" stackId="a" fill="#7c3aed" radius={[0, 0, 0, 0]} />
            <Bar dataKey="comments" stackId="a" fill="#f59e0b" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
