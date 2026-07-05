import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const accountId = req.cookies.get('ig_account_id')?.value
  if (!accountId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { competitorId } = await req.json()
  const db = createServerSupabase()

  const { data: competitor } = await db
    .from('competitors')
    .select('*')
    .eq('id', competitorId)
    .eq('account_id', accountId)
    .single()

  if (!competitor) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Get the account's own access token to scrape public profile
  const { data: account } = await db
    .from('ig_accounts')
    .select('access_token')
    .eq('id', accountId)
    .single()

  if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 })

  // Note: Getting competitor reels requires their business discovery
  // This uses Instagram Business Discovery API with your own token
  const res = await fetch(
    `https://graph.instagram.com/v21.0/?fields=business_discovery.fields(id,username,media_count,followers_count,media{id,media_type,caption,thumbnail_url,permalink,timestamp,like_count,comments_count})&id=${competitor.ig_username}&access_token=${account.access_token}`
  )
  const data = await res.json()

  if (data.error) {
    return NextResponse.json({ error: `Instagram API: ${data.error.message}` }, { status: 400 })
  }

  const discovery = data.business_discovery
  const media = discovery?.media?.data || []

  // Update competitor profile
  await db.from('competitors').update({
    ig_user_id: discovery?.id,
    followers_count: discovery?.followers_count,
    last_synced_at: new Date().toISOString(),
  }).eq('id', competitorId)

  // Insert reels
  let synced = 0
  for (const item of media) {
    if (item.media_type !== 'REELS' && item.media_type !== 'VIDEO') continue

    const { error } = await db.from('competitor_reels').upsert({
      competitor_id: competitorId,
      ig_media_id: item.id,
      caption: item.caption || null,
      thumbnail_url: item.thumbnail_url || null,
      permalink: item.permalink,
      timestamp: item.timestamp,
      likes: item.like_count || 0,
      comments: item.comments_count || 0,
    }, { onConflict: 'competitor_id,ig_media_id' })

    if (!error) synced++
  }

  return NextResponse.json({ synced })
}
