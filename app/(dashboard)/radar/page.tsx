import { cookies } from 'next/headers'
import { createServerSupabase } from '@/lib/supabase'
import { getRangeBounds, formatNumber } from '@/lib/utils'
import { MessageCircle, Crown, BarChart3, Trophy } from 'lucide-react'
import ReferenciasClient from '@/components/referencias/ReferenciasClient'
import KPICard from '@/components/ui/KPICard'
import PeriodToggle from '@/components/dashboard/PeriodToggle'
import CompetitorRankingTable, { type CompetitorRow } from '@/components/radar/CompetitorRankingTable'
import Link from 'next/link'
import type { Competitor, CompetitorReel } from '@/types'
import type { CTAType } from '@/lib/cta-classifier'

interface CompetitorWithReels extends Competitor {
  competitor_reels: CompetitorReel[]
}

const MODE_OPTIONS = [
  { value: 'mine', label: 'Mi Radar' },
  { value: 'all', label: 'Todos' },
]

const PERIOD_OPTIONS = [
  { value: '7d', label: '7d' },
  { value: '30d', label: '30d' },
  { value: '90d', label: '90d' },
]

export default async function RadarPage({ searchParams }: { searchParams: Promise<{ mode?: string; range?: string }> }) {
  const cookieStore = await cookies()
  const accountId = cookieStore.get('ig_account_id')?.value!
  const sp = await searchParams
  const mode = sp.mode === 'all' ? 'all' : 'mine'
  const range = sp.range || '30d'

  const db = createServerSupabase()
  const [{ data: competitors }, { data: refs }, { data: brand }, { data: bestOwnReel }] = await Promise.all([
    db.from('competitors')
      .select('*, competitor_reels(*)')
      .eq('account_id', accountId)
      .order('created_at', { ascending: false }),
    db.from('reference_videos').select('*').eq('account_id', accountId).order('created_at', { ascending: false }),
    db.from('brand_dna').select('content').eq('account_id', accountId).single(),
    db.from('reels').select('id,caption,comments').eq('account_id', accountId).order('comments', { ascending: false }).limit(1),
  ])

  const { start } = mode === 'mine' ? getRangeBounds(range) : { start: null }

  const rows: CompetitorRow[] = ((competitors || []) as CompetitorWithReels[]).map((c) => {
    const allReels = c.competitor_reels || []
    const periodReels = start ? allReels.filter((r) => r.timestamp && new Date(r.timestamp) >= start) : allReels
    const sorted = [...periodReels].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    const totalComments = periodReels.reduce((s, r) => s + (r.comments || 0), 0)
    const totalViews = periodReels.reduce((s, r) => s + (r.views || 0), 0)
    return {
      competitor: c,
      reels: sorted,
      totalComments,
      totalViews,
      engagement: totalViews > 0 ? (totalComments / totalViews) * 100 : 0,
      lastDate: sorted[0]?.timestamp ?? null,
      lastCtaType: (sorted[0]?.cta_type as CTAType) ?? 'NONE',
    }
  }).sort((a, b) => b.totalComments - a.totalComments)

  const commentsTotal = rows.reduce((s, r) => s + r.totalComments, 0)
  const reelCountTotal = rows.reduce((s, r) => s + r.reels.length, 0)
  const mostCommented = rows.length ? rows.reduce((best, r) => (r.totalComments > best.totalComments ? r : best), rows[0]) : null
  const avgCommentsPerReel = reelCountTotal > 0 ? commentsTotal / reelCountTotal : 0
  const bestReel = (bestOwnReel || [])[0] as { id: string; caption: string | null; comments: number } | undefined

  return (
    <div>
      <h1 className="dash-greeting">Radar de Competencia IG</h1>
      <p className="dash-subtitle" style={{ marginBottom: 24 }}>
        Rankeá a tus competidores por comentarios, detectá qué CTA usan, y robá lo que funciona.
      </p>

      <div className="grid-stats-4" style={{ marginBottom: 20 }}>
        <KPICard
          label="Comentarios Totales"
          value={formatNumber(commentsTotal)}
          accentColor="var(--kpi-blue)"
          icon={<MessageCircle size={18} strokeWidth={1.75} color="var(--kpi-blue)" />}
        />
        <KPICard
          label="Más Comentado"
          value={mostCommented && mostCommented.totalComments > 0 ? `@${mostCommented.competitor.ig_username}` : '—'}
          accentColor="var(--kpi-pink)"
          icon={<Crown size={18} strokeWidth={1.75} color="var(--kpi-pink)" />}
        />
        <KPICard
          label="Promedio Comentarios/Reel"
          value={avgCommentsPerReel.toFixed(1)}
          accentColor="var(--kpi-green)"
          icon={<BarChart3 size={18} strokeWidth={1.75} color="var(--kpi-green)" />}
        />
        <KPICard
          label="Tu Mejor Reel"
          value={bestReel ? formatNumber(bestReel.comments || 0) : '—'}
          accentColor="var(--kpi-purple)"
          icon={<Trophy size={18} strokeWidth={1.75} color="var(--kpi-purple)" />}
        />
      </div>

      <div className="filter-bar">
        <PeriodToggle current={mode} options={MODE_OPTIONS} paramName="mode" label="Modo" />
        {mode === 'mine' && <PeriodToggle current={range} options={PERIOD_OPTIONS} paramName="range" label="Período" />}
      </div>

      <div style={{ marginTop: 16 }}>
        <CompetitorRankingTable rows={rows} accountId={accountId} />
      </div>

      <div style={{ marginTop: 40 }}>
        <div className="section-header-row">
          <div>
            <h2 className="dash-greeting" style={{ fontSize: 18, marginBottom: 4 }}>Videos de Referencia</h2>
            <p className="dash-subtitle">
              Subí un reel de otro creador. Klar lo analiza y te genera una versión adaptada a tu estilo.
            </p>
          </div>
          {!brand?.content && (
            <Link href="/marca" className="warning-link">
              Configurá tu ADN de Marca
            </Link>
          )}
        </div>
        <ReferenciasClient
          references={refs || []}
          accountId={accountId}
          brandDNA={brand?.content || ''}
        />
      </div>
    </div>
  )
}
