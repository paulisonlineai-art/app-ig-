import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerSupabase } from '@/lib/supabase'

const GRAPH_BASE = 'https://graph.instagram.com/v21.0'

export async function GET() {
  const cookieStore = await cookies()
  const accountId = cookieStore.get('ig_account_id')?.value
  if (!accountId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const db = createServerSupabase()
  const { data: account } = await db
    .from('ig_accounts')
    .select('ig_access_token, username')
    .eq('id', accountId)
    .single()

  if (!account?.ig_access_token) return NextResponse.json({ error: 'No token' })

  const token = account.ig_access_token

  // 1. Fetch first 3 media items
  const mediaUrl = `${GRAPH_BASE}/me/media?fields=id,caption,media_type,like_count,comments_count&limit=3&access_token=${token}`
  const mediaRes = await fetch(mediaUrl)
  const mediaData = await mediaRes.json()

  if (mediaData.error) {
    return NextResponse.json({ step: 'media_fetch', error: mediaData.error })
  }

  const results: any[] = []

  for (const item of (mediaData.data || []).slice(0, 2)) {
    const result: any = {
      id: item.id,
      type: item.media_type,
      caption: (item.caption || '').slice(0, 50),
      like_count: item.like_count,
      comments_count: item.comments_count,
    }

    // Try different metric sets
    const metricSets = [
      'ig_reels_video_view_total_count,reach,saved,shares,total_interactions',
      'plays,reach,saved,shares,total_interactions',
      'ig_reels_aggregated_all_plays_count,reach,saved,shares',
      'reach,saved,shares',
    ]

    for (const metrics of metricSets) {
      const insightUrl = `${GRAPH_BASE}/${item.id}/insights?metric=${metrics}&access_token=${token}`
      const insightRes = await fetch(insightUrl)
      const insightData = await insightRes.json()

      result[`metrics_${metrics.split(',')[0]}`] = insightData.error
        ? { error: insightData.error.message, code: insightData.error.code }
        : { data: (insightData.data || []).map((m: any) => ({ name: m.name, value: m.values?.[0]?.value ?? m.value })) }
    }

    results.push(result)
  }

  return NextResponse.json({ username: account.username, results }, { status: 200 })
}
