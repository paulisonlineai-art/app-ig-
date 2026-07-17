import { NextRequest, NextResponse } from 'next/server'
import { chatWithKlar } from '@/lib/ai'
import { createServerSupabase } from '@/lib/supabase'
import { checkRateLimit } from '@/lib/rateLimit'

export async function POST(req: NextRequest) {
  const accountId = req.cookies.get('ig_account_id')?.value
  if (!accountId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const limit = await checkRateLimit(accountId, 'chat')
  if (!limit.ok) return NextResponse.json({ error: `Esperá ${limit.retryAfterSeconds}s antes de preguntar de nuevo` }, { status: 429 })

  const { question, reelId } = await req.json()
  if (!question?.trim()) return NextResponse.json({ error: 'Question required' }, { status: 400 })

  const db = createServerSupabase()

  const [{ data: reels }, { data: account }] = await Promise.all([
    db.from('reels').select('caption,views,multiplier,like_rate,comment_rate,hook,timestamp,is_trial').eq('account_id', accountId).order('views', { ascending: false }).limit(20),
    db.from('ig_accounts').select('*').eq('id', accountId).single(),
  ])

  try {
    const answer = await chatWithKlar({
      question,
      reels: reels || [],
      accountStats: {
        followers: account?.followers_count,
        username: account?.username,
        total_reels: reels?.length,
      },
    })
    return NextResponse.json({ answer })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Error consultando a Klar' }, { status: 500 })
  }
}
