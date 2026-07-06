import { createServerSupabase } from '@/lib/supabase'
import { scrapeOwnReels } from '@/lib/apify'
import { calcMultiplier, calcRate } from '@/lib/utils'

export async function syncAccountReels(accountId: string): Promise<{ synced: number; message?: string; trialCodesFound?: number }> {
  const db = createServerSupabase()
  const { data: account } = await db.from('ig_accounts').select('*').eq('id', accountId).single()
  if (!account) throw new Error('Cuenta no encontrada')

  const { reels, trialShortCodes } = await scrapeOwnReels(account.username)

  if (!reels.length) return { synced: 0, message: 'No se encontraron reels', trialCodesFound: trialShortCodes.size }

  // Calculate averages for multiplier
  const avgViews = reels.reduce((s, r) => s + r.videoViewCount, 0) / reels.length

  const upserts = reels.map(r => {
    const views = r.videoViewCount || r.videoPlayCount || 0
    const likes = r.likesCount || 0
    const comments = r.commentsCount || 0
    const multiplier = calcMultiplier(views, avgViews)

    return {
      account_id: accountId,
      ig_media_id: r.shortCode || r.id,
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
      like_rate: calcRate(likes, views),
      save_rate: 0,
      comment_rate: calcRate(comments, views),
      share_rate: 0,
      multiplier,
      duration_seconds: r.videoDuration ? Math.round(r.videoDuration) : null,
      synced_at: new Date().toISOString(),
    }
  })

  const { error } = await db.from('reels').upsert(upserts, { onConflict: 'account_id,ig_media_id' })
  if (error) throw new Error(error.message)

  // Recalculate multipliers with real average
  const { data: allReels } = await db.from('reels').select('id, views').eq('account_id', accountId)
  if (allReels && allReels.length > 0) {
    const realAvg = allReels.reduce((s, r) => s + (r.views || 0), 0) / allReels.length
    await Promise.all(
      allReels.map(r =>
        db.from('reels').update({ multiplier: calcMultiplier(r.views || 0, realAvg) }).eq('id', r.id)
      )
    )
  }

  return { synced: reels.length, trialCodesFound: trialShortCodes.size }
}
