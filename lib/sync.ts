import { createServerSupabase } from '@/lib/supabase'
import {
  getInstagramMedia,
  getMediaInsights,
  refreshLongLivedToken,
  IGExpiredTokenError,
  IGRateLimitError,
} from '@/lib/instagram'
import { calcMultiplier, calcRate } from '@/lib/utils'

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000
const ZERO_INSIGHTS = { plays: 0, reach: 0, saved: 0, shares: 0, total_interactions: 0, likes: 0, comments: 0 }

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function syncAccountReels(accountId: string): Promise<{
  synced: number
  message?: string
  token_refreshed?: boolean
  error?: string
}> {
  const db = createServerSupabase()
  const { data: account } = await db
    .from('ig_accounts')
    .select('id, username, ig_access_token, ig_token_expires_at')
    .eq('id', accountId)
    .single()

  if (!account) throw new Error('Cuenta no encontrada')
  if (!account.ig_access_token) {
    return { synced: 0, error: 'token_missing', message: 'Cuenta no autenticada con Instagram Graph API. Por favor reconectá tu cuenta.' }
  }

  let token = account.ig_access_token as string
  let tokenRefreshed = false

  // Auto-refresh token if expiring within 7 days
  if (account.ig_token_expires_at) {
    const expiresAt = new Date(account.ig_token_expires_at).getTime()
    const msRemaining = expiresAt - Date.now()

    if (msRemaining < 0) {
      return { synced: 0, error: 'token_expired', message: 'El token de Instagram expiró. Por favor reconectá tu cuenta.' }
    }

    if (msRemaining < SEVEN_DAYS_MS) {
      try {
        const refreshed = await refreshLongLivedToken(token)
        token = refreshed.access_token
        const newExpiry = new Date(Date.now() + refreshed.expires_in * 1000).toISOString()
        await db.from('ig_accounts').update({
          ig_access_token: token,
          ig_token_expires_at: newExpiry,
        }).eq('id', accountId)
        tokenRefreshed = true
        console.log(`[sync] Token refreshed for account ${accountId}`)
      } catch (e) {
        if (e instanceof IGExpiredTokenError) {
          return { synced: 0, error: 'token_expired', message: 'El token de Instagram expiró. Por favor reconectá tu cuenta.' }
        }
        console.warn(`[sync] Token refresh failed for ${accountId}:`, e)
        // Continue with old token — it's still valid for now
      }
    }
  }

  try {
    // Fetch media list
    const mediaItems = await getInstagramMedia(token, 50)
    if (!mediaItems.length) {
      return { synced: 0, message: 'No se encontraron reels', token_refreshed: tokenRefreshed }
    }

    // Fetch insights for each reel in sequence (avoid rate limit bursts)
    const clamp = (n: number, max = 99999999) => Math.min(Math.max(Math.round(n) || 0, 0), max)
    const clampRate = (n: number) => Math.min(Math.max(Number(n.toFixed(4)) || 0, 0), 100)

    const enrichedReels: Array<{
      media: (typeof mediaItems)[number]
      insights: Awaited<ReturnType<typeof getMediaInsights>>
    }> = []

    let insightsSuccessCount = 0
    let insightsFailCount = 0

    for (const media of mediaItems) {
      try {
        const insights = await getMediaInsights(token, media.id)
        enrichedReels.push({ media, insights })
        insightsSuccessCount++
        // Small delay between insight calls to avoid rate limits
        if (mediaItems.length > 10) await sleep(200)
      } catch (e) {
        if (e instanceof IGRateLimitError) {
          console.warn(`[sync] Rate limit hit fetching insights for ${media.id} — waiting 60s and retrying once`)
          await sleep(60000)
          try {
            const insights = await getMediaInsights(token, media.id)
            enrichedReels.push({ media, insights })
            insightsSuccessCount++
          } catch (e2) {
            console.warn(`[sync] Insights retry failed for ${media.id} — skipping:`, e2)
            enrichedReels.push({ media, insights: ZERO_INSIGHTS })
            insightsFailCount++
          }
        } else {
          console.warn(`[sync] Could not fetch insights for ${media.id}:`, e)
          enrichedReels.push({ media, insights: ZERO_INSIGHTS })
          insightsFailCount++
        }
      }
    }
    console.log(`[sync] Insights fetched: ${insightsSuccessCount} OK, ${insightsFailCount} failed out of ${mediaItems.length} reels`)

    // Calculate average views (plays) for multiplier baseline
    const avgViews =
      enrichedReels.reduce((s, { insights }) => s + (insights.plays || 0), 0) /
      (enrichedReels.length || 1)

    const upserts = enrichedReels.map(({ media, insights }) => {
      // Graph API metric mapping:
      //   plays         → views  (from insights)
      //   saved         → saves  (from insights)
      //   shares        → shares (from insights)
      //   reach         → reach  (from insights)
      //   likes/comments come from media basic fields (NOT available as insights metrics)
      const views = clamp(insights.plays || 0)
      const likes = clamp(media.like_count || 0)
      const comments = clamp(media.comments_count || 0)
      const saves = clamp(insights.saved || 0)
      const shares = clamp(insights.shares || 0)
      const reach = clamp(insights.reach || 0)
      const totalInteractions = clamp(insights.total_interactions || 0)
      const multiplier = Number(calcMultiplier(views, avgViews).toFixed(4)) || 1

      return {
        account_id: accountId,
        ig_media_id: media.id,
        media_type: 'VIDEO' as const,
        // Trial reel detection is not available via Graph API — default false
        is_trial: false,
        caption: media.caption || null,
        thumbnail_url: media.thumbnail_url || null,
        permalink: media.permalink,
        timestamp: media.timestamp,
        views,
        likes,
        comments,
        shares,
        saves,
        reach,
        total_interactions: totalInteractions,
        like_rate: clampRate(calcRate(likes, views)),
        save_rate: clampRate(calcRate(saves, views)),
        comment_rate: clampRate(calcRate(comments, views)),
        share_rate: clampRate(calcRate(shares, views)),
        multiplier,
        duration_seconds: null,
        synced_at: new Date().toISOString(),
      }
    })

    const { error } = await db.from('reels').upsert(upserts, { onConflict: 'account_id,ig_media_id' })
    if (error) throw new Error(error.message)

    // Recalculate multipliers with real account-wide average
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
          db.from('reels').update({ multiplier: parseFloat(m) }).in('id', ids),
        ),
      )
    }

    return { synced: enrichedReels.length, token_refreshed: tokenRefreshed }
  } catch (e) {
    if (e instanceof IGExpiredTokenError) {
      return { synced: 0, error: 'token_expired', message: 'El token de Instagram expiró. Por favor reconectá tu cuenta.' }
    }
    throw e
  }
}
