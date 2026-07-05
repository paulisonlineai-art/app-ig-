import { NextRequest, NextResponse } from 'next/server'
import { getReels, getReelInsights } from '@/lib/instagram'
import { createServerSupabase } from '@/lib/supabase'
import { calcRate } from '@/lib/utils'

export async function POST(req: NextRequest) {
  const accountId = req.cookies.get('ig_account_id')?.value
  if (!accountId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const db = createServerSupabase()
  const { data: account } = await db
    .from('ig_accounts')
    .select('*')
    .eq('id', accountId)
    .single()

  if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 })

  let after: string | undefined
  let totalSynced = 0

  // Get existing reel IDs to avoid duplicates
  const { data: existingReels } = await db
    .from('reels')
    .select('ig_media_id')
    .eq('account_id', accountId)

  const existingIds = new Set((existingReels || []).map((r: { ig_media_id: string }) => r.ig_media_id))

  do {
    const media = await getReels(account.ig_user_id, account.access_token, after)
    if (media.error || !media.data?.length) break

    const reelsToInsert = []

    for (const item of media.data) {
      if (item.media_type !== 'REELS' && item.media_type !== 'VIDEO') continue
      if (existingIds.has(item.id)) continue

      const insights = await getReelInsights(item.id, account.access_token)
      if (!insights) continue

      const views = insights.views || insights.plays || 0
      const likes = insights.likes || 0
      const comments = insights.comments || 0
      const shares = insights.shares || 0
      const saves = insights.saved || 0

      reelsToInsert.push({
        account_id: accountId,
        ig_media_id: item.id,
        media_type: item.media_type,
        is_trial: !item.is_shared_to_feed,
        caption: item.caption || null,
        thumbnail_url: item.thumbnail_url || null,
        permalink: item.permalink,
        timestamp: item.timestamp,
        views,
        likes,
        comments,
        shares,
        saves,
        reach: insights.reach || 0,
        like_rate: calcRate(likes, views),
        save_rate: calcRate(saves, views),
        comment_rate: calcRate(comments, views),
        share_rate: calcRate(shares, views),
        multiplier: 1, // will be recalculated after all reels are saved
        organic_percentage: 100,
        ads_percentage: 0,
        synced_at: new Date().toISOString(),
      })

      existingIds.add(item.id)
    }

    if (reelsToInsert.length) {
      await db.from('reels').insert(reelsToInsert)
      totalSynced += reelsToInsert.length
    }

    after = media.paging?.cursors?.after
    if (!media.paging?.next) break

  } while (after)

  // Recalculate multipliers for all reels
  const { data: allReels } = await db
    .from('reels')
    .select('id, views')
    .eq('account_id', accountId)

  if (allReels?.length) {
    const avgViews = allReels.reduce((s: number, r: { views: number }) => s + r.views, 0) / allReels.length
    for (const reel of allReels) {
      await db
        .from('reels')
        .update({ multiplier: avgViews > 0 ? reel.views / avgViews : 1 })
        .eq('id', reel.id)
    }
  }

  return NextResponse.json({ synced: totalSynced })
}
