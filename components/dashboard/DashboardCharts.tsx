'use client'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Area, AreaChart } from 'recharts'

export default function DashboardCharts({ audienceStats, reels }: { audienceStats: any[]; reels: any[] }) {
  const reachData = audienceStats.map(s => ({
    date: new Date(s.date).toLocaleDateString('es', { month: 'short', day: 'numeric' }),
    Alcance: s.reach,
    Impresiones: s.impressions,
  }))

  const reelData = reels
    .filter((r: any) => r.timestamp)
    .sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .map((r: any) => ({
      date: new Date(r.timestamp).toLocaleDateString('es', { month: 'short', day: 'numeric' }),
      views: r.views || 0,
    }))

  const tooltipStyle = {
    background: '#0a0a0a',
    border: '1px solid #222',
    borderRadius: 10,
    fontSize: 12,
    color: '#fff',
    boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
    padding: '8px 12px',
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px 8px' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Vistas por reel</div>
        </div>
        <div style={{ padding: '4px 12px 12px' }}>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={reelData}>
              <XAxis dataKey="date" tick={{ fill: '#555', fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis hide />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="views" fill="#F7007C" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px 8px' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Engagement trend</div>
        </div>
        <div style={{ padding: '4px 12px 12px' }}>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={reachData}>
              <defs>
                <linearGradient id="engGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F7007C" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#F7007C" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fill: '#555', fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis hide />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="Alcance" stroke="#F7007C" strokeWidth={2} fill="url(#engGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
