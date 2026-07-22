import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { scrapeCompetitorReels, scrapeInstagramUser } from '@/lib/scraper'
import { checkRateLimit } from '@/lib/rateLimit'

export async function POST(req: NextRequest) {
  const accountId = req.cookies.get('ig_account_id')?.value
  if (!accountId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const limit = await checkRateLimit(accountId, 'competitor_sync')
  if (!limit.ok) return NextResponse.json({ error: !limit.ok && "message" in limit ? limit.message : `Límite alcanzado. Intentá en ${limit.retryAfterSeconds}s` }, { status: 429 })

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
    const limit = Math.max(currentCount || 0, 20) + (expandBy || 0)

    // Competitors are public accounts you have no OAuth access to — Apify's
    // public scraper is the right tool here, unlike the old Business
    // Discovery Graph API call which required a token this app never has.
    const [reels, profile] = await Promise.all([
      scrapeCompetitorReels(competitor.ig_username, limit),
      scrapeInstagramUser(competitor.ig_username).catch(() => null),
    ])

    await db.from('competitors').update({
      ...(profile ? {
        ig_user_id: profile.id,
        profile_picture_url: profile.profilePicUrl || null,
        followers_count: profile.followersCount,
      } : {}),
      last_synced_at: new Date().toISOString(),
    }).eq('id', competitorId)

    let synced = 0
    for (const r of reels) {
      const { error } = await db.from('competitor_reels').upsert({
        competitor_id: competitorId,
        ig_media_id: r.shortCode || r.id,
        caption: r.caption || null,
        thumbnail_url: r.displayUrl || null,
        video_url: r.videoUrl || null,
        permalink: r.url,
        timestamp: r.timestamp,
        views: r.videoViewCount || r.videoPlayCount || 0,
        likes: r.likesCount || 0,
        comments: r.commentsCount || 0,
      }, { onConflict: 'competitor_id,ig_media_id' })

      if (!error) synced++
    }

    return NextResponse.json({ synced })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Error sincronizando competidor' }, { status: 500 })
  }
}
