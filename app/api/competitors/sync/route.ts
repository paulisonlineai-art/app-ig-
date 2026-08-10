import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { getCompetitorProfile, IGPermissionError } from '@/lib/instagram'
import { scrapeCompetitorReels, scrapeInstagramUser } from '@/lib/scraper-legacy'
import { checkRateLimit } from '@/lib/rateLimit'
import { classifyCTA } from '@/lib/cta-classifier'

export async function POST(req: NextRequest) {
  const accountId = req.cookies.get('ig_account_id')?.value
  if (!accountId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const rateLimit = await checkRateLimit(accountId, 'competitor_sync')
  if (!rateLimit.ok) {
    return NextResponse.json(
      { error: !rateLimit.ok && 'message' in rateLimit ? rateLimit.message : `Límite alcanzado. Intentá en ${rateLimit.retryAfterSeconds}s` },
      { status: 429 },
    )
  }

  const { competitorId, expandBy } = await req.json()
  const db = createServerSupabase()

  const { data: competitor } = await db
    .from('competitors')
    .select('*')
    .eq('id', competitorId)
    .eq('account_id', accountId)
    .single()

  if (!competitor) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  try {
    // A plain re-sync should never shrink what's already tracked (the top-N-
    // by-views logic could otherwise drop reels if view counts shifted), and
    // "track more" (expandBy) grows the pool past whatever's tracked today.
    const { count: currentCount } = await db
      .from('competitor_reels')
      .select('*', { count: 'exact', head: true })
      .eq('competitor_id', competitorId)
    const fetchLimit = Math.max(currentCount || 0, 20) + (expandBy || 0)

    // Fetch the authenticated account's token + numeric IG user ID
    // (required for Business Discovery API)
    const { data: account } = await db
      .from('ig_accounts')
      .select('ig_access_token, ig_user_id_numeric, ig_account_type')
      .eq('id', accountId)
      .single()

    let dataSource: 'graph_api' | 'scraper' = 'scraper'
    let reels: Array<{
      ig_media_id: string
      caption: string | null
      thumbnail_url: string | null
      video_url: string | null
      permalink: string
      timestamp: string
      views: number
      likes: number
      comments: number
    }> = []
    let profileUpdate: {
      ig_user_id?: string
      profile_picture_url?: string | null
      followers_count?: number
      bio?: string | null
    } = {}

    // Try Business Discovery API first (requires Business/Creator account + token)
    const canUseGraphApi =
      account?.ig_access_token &&
      account?.ig_user_id_numeric &&
      (account.ig_account_type === 'BUSINESS' || account.ig_account_type === 'CREATOR')

    if (canUseGraphApi) {
      try {
        const competitorData = await getCompetitorProfile(
          account!.ig_access_token!,
          String(account!.ig_user_id_numeric),
          competitor.ig_username,
        )

        dataSource = 'graph_api'
        profileUpdate = {
          ig_user_id: competitorData.id,
          profile_picture_url: competitorData.profile_picture_url ?? null,
          followers_count: competitorData.followers_count,
          bio: competitorData.biography ?? null,
        }

        reels = competitorData.media.slice(0, fetchLimit).map((m) => ({
          ig_media_id: m.id,
          caption: m.caption ?? null,
          thumbnail_url: m.thumbnail_url ?? null,
          video_url: m.media_url ?? null,
          permalink: m.permalink,
          timestamp: m.timestamp,
          // Business Discovery API does not provide plays/views for competitor media
          views: 0,
          likes: m.like_count ?? 0,
          comments: m.comments_count ?? 0,
        }))
      } catch (e) {
        // Fall through to Apify scraper
        if (e instanceof IGPermissionError) {
          console.warn(`[competitors/sync] Business Discovery failed for ${competitor.ig_username}, falling back to Apify:`, e.message)
        } else {
          console.warn(`[competitors/sync] Graph API failed for ${competitor.ig_username}, falling back to Apify:`, e)
        }
        dataSource = 'scraper'
      }
    }

    // Apify fallback: personal accounts, failed Business Discovery, or missing token
    if (dataSource === 'scraper') {
      const [scraped, profile] = await Promise.all([
        scrapeCompetitorReels(competitor.ig_username, fetchLimit),
        scrapeInstagramUser(competitor.ig_username).catch(() => null),
      ])

      if (profile) {
        profileUpdate = {
          ig_user_id: profile.id,
          profile_picture_url: profile.profilePicUrl ?? null,
          followers_count: profile.followersCount,
          bio: profile.biography || null,
        }
      }

      reels = scraped.map((r) => ({
        ig_media_id: r.shortCode || r.id,
        caption: r.caption ?? null,
        thumbnail_url: r.displayUrl ?? null,
        video_url: r.videoUrl ?? null,
        permalink: r.url,
        timestamp: r.timestamp,
        views: r.videoViewCount || r.videoPlayCount || 0,
        likes: r.likesCount ?? 0,
        comments: r.commentsCount ?? 0,
      }))
    }

    // Update competitor profile metadata
    await db
      .from('competitors')
      .update({
        ...profileUpdate,
        last_synced_at: new Date().toISOString(),
      })
      .eq('id', competitorId)

    // Upsert reels
    let synced = 0
    for (const r of reels) {
      const { error } = await db.from('competitor_reels').upsert(
        {
          competitor_id: competitorId,
          ig_media_id: r.ig_media_id,
          caption: r.caption,
          thumbnail_url: r.thumbnail_url,
          video_url: r.video_url,
          permalink: r.permalink,
          timestamp: r.timestamp,
          views: r.views,
          likes: r.likes,
          comments: r.comments,
          cta_type: classifyCTA(r.caption),
        },
        { onConflict: 'competitor_id,ig_media_id' },
      )
      if (!error) synced++
    }

    return NextResponse.json({ synced, data_source: dataSource })
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Error sincronizando competidor' },
      { status: 500 },
    )
  }
}
