'use client'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

export default function DashboardCharts({ audienceStats, reels }: { audienceStats: any[]; reels: any[] }) {
  const reachData = audienceStats.map(s => ({
    date: new Date(s.date).toLocaleDateString('es', { month: 'short', day: 'numeric' }),
    Alcance: s.reach,
    Impresiones: s.impressions,
  }))

  const byDate: Record<string, { likes: number; comments: number }> = {}
  for (const r of reels) {
    const d = new Date(r.timestamp).toLocaleDateString('es', { month: 'short', day: 'numeric' })
    if (!byDate[d]) byDate[d] = { likes: 0, comments: 0 }
    byDate[d].likes += r.likes || 0
    byDate[d].comments += r.comments || 0
  }
  const interactData = Object.entries(byDate).map(([date, v]) => ({ date, ...v }))

  const tooltipStyle = {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 10,
    fontSize: 12,
    color: 'var(--text)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    padding: '8px 12px',
  }

  return (
    <div className="dash-charts-grid">
      <div className="dash-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="dash-card-title" style={{ marginBottom: 0 }}>Alcance & Visibilidad</div>
          <div style={{ display: 'flex', gap: 12 }}>
            {[{ color: '#7c3aed', label: 'Alcance' }, { color: '#a78bfa', label: 'Impresiones' }].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-muted)' }}>
                <div style={{ width: 8, height: 3, background: l.color, borderRadius: 2 }} />
                {l.label}
              </div>
            ))}
          </div>
        </div>
        <div style={{ padding: '4px 12px 12px' }}>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={reachData}>
              <XAxis dataKey="date" tick={{ fill: 'var(--text-faint)', fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis hide />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="Alcance" stroke="#7c3aed" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="Impresiones" stroke="#a78bfa" dot={false} strokeWidth={1.5} strokeDasharray="4 4" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="dash-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="dash-card-title" style={{ marginBottom: 0 }}>Interacciones</div>
          <div style={{ display: 'flex', gap: 12 }}>
            {[{ color: '#7c3aed', label: 'Me gusta' }, { color: '#f59e0b', label: 'Comentarios' }].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-muted)' }}>
                <div style={{ width: 8, height: 8, background: l.color, borderRadius: 2 }} />
                {l.label}
              </div>
            ))}
          </div>
        </div>
        <div style={{ padding: '4px 12px 12px' }}>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={interactData}>
              <XAxis dataKey="date" tick={{ fill: 'var(--text-faint)', fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis hide />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="likes" stackId="a" fill="#7c3aed" radius={[0, 0, 0, 0]} />
              <Bar dataKey="comments" stackId="a" fill="#f59e0b" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
