import { NextRequest, NextResponse } from 'next/server'
import { analyzeReel } from '@/lib/ai'
import { createServerSupabase } from '@/lib/supabase'
import { calcAverages } from '@/lib/utils'

export async function POST(req: NextRequest) {
  const accountId = req.cookies.get('ig_account_id')?.value
  if (!accountId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { reelId } = await req.json()

  const db = createServerSupabase()
  const [{ data: reel }, { data: allReels }] = await Promise.all([
    db.from('reels').select('*').eq('id', reelId).eq('account_id', accountId).single(),
    db.from('reels').select('views,like_rate,save_rate,comment_rate,share_rate,words_per_minute').eq('account_id', accountId),
  ])

  if (!reel) return NextResponse.json({ error: 'Reel not found' }, { status: 404 })

  const averages = calcAverages(allReels || [])
  const analysis = await analyzeReel(reel, averages)

  await db.from('reels').update({ ai_analysis: analysis }).eq('id', reelId)

  return NextResponse.json({ analysis })
}
