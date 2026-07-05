import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { scrapeCompetitorReels } from '@/lib/apify'

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

  try {
    // Competitors are public accounts you have no OAuth access to — Apify's
    // public scraper is the right tool here, unlike the old Business
    // Discovery Graph API call which required a token this app never has.
    const reels = await scrapeCompetitorReels(competitor.ig_username, 20)

    await db.from('competitors').update({
      last_synced_at: new Date().toISOString(),
    }).eq('id', competitorId)

    let synced = 0
    for (const r of reels) {
      const { error } = await db.from('competitor_reels').upsert({
        competitor_id: competitorId,
        ig_media_id: r.shortCode || r.id,
        caption: r.caption || null,
        thumbnail_url: r.displayUrl || null,
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
