import { createServerSupabase } from '@/lib/supabase'
import { scrapeOwnReels } from '@/lib/scraper'
import { calcMultiplier, calcRate } from '@/lib/utils'

export async function syncAccountReels(accountId: string): Promise<{ synced: number; message?: string; trialCodesFound?: number }> {
  const db = createServerSupabase()
  const { data: account } = await db.from('ig_accounts').select('*').eq('id', accountId).single()
  if (!account) throw new Error('Cuenta no encontrada')

  const { reels, trialShortCodes } = await scrapeOwnReels(account.username)

  if (!reels.length) return { synced: 0, message: 'No se encontraron reels', trialCodesFound: trialShortCodes.size }

  // Calculate averages for multiplier
  const avgViews = reels.reduce((s, r) => s + r.videoViewCount, 0) / reels.length

  const clamp = (n: number, max = 99999999) => Math.min(Math.max(Math.round(n) || 0, 0), max)
  const clampRate = (n: number) => Math.min(Math.max(Number(n.toFixed(4)) || 0, 0), 100)

  const upserts = reels.map(r => {
    const views = clamp(r.videoViewCount || r.videoPlayCount || 0)
    const likes = clamp(r.likesCount || 0)
    const comments = clamp(r.commentsCount || 0)
    const multiplier = Number(calcMultiplier(views, avgViews).toFixed(4)) || 1

    return {
      account_id: accountId,
      ig_media_id: r.shortCode || String(r.id),
      media_type: 'VIDEO',
      is_trial: trialShortCodes.has(r.shortCode),
      caption: r.caption || null,
      thumbnail_url: r.displayUrl || null,
      permalink: r.url,
      timestamp: r.timestamp,
      views,
      likes,
      comments,
      shares: 0,
      saves: 0,
      reach: 0,
      like_rate: clampRate(calcRate(likes, views)),
      save_rate: 0,
      comment_rate: clampRate(calcRate(comments, views)),
      share_rate: 0,
      multiplier,
      duration_seconds: r.videoDuration ? Math.min(Math.round(r.videoDuration), 9999) : null,
      synced_at: new Date().toISOString(),
    }
  })

  const { error } = await db.from('reels').upsert(upserts, { onConflict: 'account_id,ig_media_id' })
  if (error) throw new Error(error.message)

  // Recalculate multipliers with real average — batch by multiplier value to reduce queries
  const { data: allReels } = await db.from('reels').select('id, views').eq('account_id', accountId)
  if (allReels && allReels.length > 0) {
    const realAvg = allReels.reduce((s, r) => s + (r.views || 0), 0) / allReels.length
    const byMultiplier: Record<string, string[]> = {}
    for (const r of allReels) {
      const m = calcMultiplier(r.views || 0, realAvg).toFixed(4)
      if (!byMultiplier[m]) byMultiplier[m] = []
      byMultiplier[m].push(r.id)
    }
    await Promise.all(
      Object.entries(byMultiplier).map(([m, ids]) =>
        db.from('reels').update({ multiplier: parseFloat(m) }).in('id', ids)
      )
    )
  }

  return { synced: reels.length, trialCodesFound: trialShortCodes.size }
}
