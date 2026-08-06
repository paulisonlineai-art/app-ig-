'use client'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'

interface ReelData {
  views: number
  timestamp: string
}

interface AudienceStat {
  date: string
  reach: number
  impressions: number
}

export default function DashboardCharts({ audienceStats, reels }: { audienceStats: AudienceStat[]; reels: ReelData[] }) {
  const reelData = reels
    .filter(r => r.timestamp)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .map(r => ({
      date: new Date(r.timestamp).toLocaleDateString('es', { month: 'short', day: 'numeric' }),
      views: r.views || 0,
    }))

  const reachData = audienceStats.map(s => ({
    date: new Date(s.date).toLocaleDateString('es', { month: 'short', day: 'numeric' }),
    Alcance: s.reach,
    Impresiones: s.impressions,
  }))

  const tooltipStyle = {
    background: 'var(--chart-tooltip-bg)',
    border: '1px solid var(--chart-tooltip-border)',
    borderRadius: 10,
    fontSize: 12,
    color: 'var(--chart-tooltip-text)',
    boxShadow: 'var(--shadow-lg)',
    padding: '8px 12px',
  }

  const axisTickProps = { fill: 'var(--text-faint)', fontSize: 10 }

  return (
    <div className="chart-grid">
      <div className="chart-card" style={{ animationDelay: '0.28s' }}>
        <div className="chart-card-header">
          <span className="chart-card-title">Vistas por reel</span>
          {reelData.length > 0 && <span className="chart-card-badge">{reelData.length} reels</span>}
        </div>
        <div className="chart-card-body">
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={reelData}>
              <XAxis dataKey="date" tick={axisTickProps} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis hide />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'var(--chart-grid)' }} />
              <Bar dataKey="views" fill="var(--accent)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="chart-card" style={{ animationDelay: '0.34s' }}>
        <div className="chart-card-header">
          <span className="chart-card-title">Engagement trend</span>
          {reachData.length > 0 && <span className="chart-card-badge">{reachData.length} días</span>}
        </div>
        <div className="chart-card-body">
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={reachData}>
              <defs>
                <linearGradient id="engGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F7007C" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#F7007C" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={axisTickProps} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis hide />
              <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: 'var(--border-strong)' }} />
              <Area type="monotone" dataKey="Alcance" stroke="#F7007C" strokeWidth={2} fill="url(#engGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
