import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerSupabase } from '@/lib/supabase'
import { scrapeInstagramProfile } from '@/lib/apify'
import { calcMultiplier, calcRate } from '@/lib/utils'

export const maxDuration = 300

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const accountId = cookieStore.get('ig_account_id')?.value
  if (!accountId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const db = createServerSupabase()
  const { data: account } = await db.from('ig_accounts').select('*').eq('id', accountId).single()
  if (!account) return NextResponse.json({ error: 'Cuenta no encontrada' }, { status: 404 })

  try {
    const { profile, reels } = await scrapeInstagramProfile(
      account.username,
      account.apify_session_cookie || undefined
    )

    // Update profile stats if we got them
    if (profile && profile.followersCount > 0) {
      await db.from('ig_accounts').update({
        followers_count: profile.followersCount,
        media_count: profile.postsCount,
        profile_picture_url: profile.profilePicUrl || account.profile_picture_url,
      }).eq('id', accountId)
    }

    if (!reels.length) return NextResponse.json({ synced: 0, message: 'No se encontraron reels' })

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
        is_trial: false,
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
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

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

    return NextResponse.json({ synced: reels.length })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
