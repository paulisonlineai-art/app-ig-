'use client'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts'

interface ReelPoint {
  id: string
  views: number
  timestamp: string
}

interface EngagementTotals {
  likes: number
  comments: number
  saves: number
  shares: number
}

const tooltipStyle = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 10,
  fontSize: 12,
  color: 'var(--text)',
  boxShadow: 'var(--shadow-sm)',
  padding: '8px 12px',
}

const axisTickProps = { fill: 'var(--text-faint)', fontSize: 10 }

export default function DashboardCharts({ recentReels, engagementAvg }: { recentReels: ReelPoint[]; engagementAvg: EngagementTotals }) {
  const performanceData = recentReels
    .slice()
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .map((r) => ({
      date: new Date(r.timestamp).toLocaleDateString('es', { month: 'short', day: 'numeric' }),
      views: r.views || 0,
    }))

  const avgViews = performanceData.length
    ? performanceData.reduce((s, d) => s + d.views, 0) / performanceData.length
    : 0

  const engagementData = [
    { tipo: 'Likes', valor: Math.round(engagementAvg.likes) },
    { tipo: 'Comentarios', valor: Math.round(engagementAvg.comments) },
    { tipo: 'Guardados', valor: Math.round(engagementAvg.saves) },
    { tipo: 'Compartidos', valor: Math.round(engagementAvg.shares) },
  ]

  return (
    <div className="chart-grid">
      <div className="chart-card">
        <div className="chart-card-header">
          <span className="chart-card-title">Rendimiento de Reels</span>
          {performanceData.length > 0 && <span className="chart-card-badge">Últimos {performanceData.length}</span>}
        </div>
        <div style={{ padding: '0 20px 4px', fontSize: 11, color: 'var(--text-faint)' }}>
          <span style={{ color: 'var(--success)', fontWeight: 600 }}>●</span> Sobre el promedio&nbsp;&nbsp;
          <span style={{ color: 'var(--danger)', fontWeight: 600 }}>●</span> Bajo el promedio
        </div>
        <div className="chart-card-body">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={performanceData}>
              <CartesianGrid vertical={false} stroke="var(--border)" strokeOpacity={0.5} />
              <XAxis dataKey="date" tick={axisTickProps} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis hide />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'var(--surface-2)' }} />
              <Bar dataKey="views" radius={[4, 4, 0, 0]} maxBarSize={28}>
                {performanceData.map((d, i) => (
                  <Cell key={i} fill={d.views >= avgViews ? 'var(--success)' : 'var(--danger)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="chart-card">
        <div className="chart-card-header">
          <span className="chart-card-title">Engagement por Tipo</span>
          <span className="chart-card-badge">Promedio</span>
        </div>
        <div className="chart-card-body">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={engagementData} layout="vertical" margin={{ left: 8 }}>
              <CartesianGrid horizontal={false} stroke="var(--border)" strokeOpacity={0.5} />
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="tipo"
                tick={axisTickProps}
                tickLine={false}
                axisLine={false}
                width={80}
              />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'var(--surface-2)' }} />
              <Bar dataKey="valor" fill="var(--primary)" radius={[0, 4, 4, 0]} maxBarSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
