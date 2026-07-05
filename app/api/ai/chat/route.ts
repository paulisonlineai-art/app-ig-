import { NextRequest, NextResponse } from 'next/server'
import { chatWithMoka } from '@/lib/ai'
import { createServerSupabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const accountId = req.cookies.get('ig_account_id')?.value
  if (!accountId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { question, reelId } = await req.json()
  if (!question?.trim()) return NextResponse.json({ error: 'Question required' }, { status: 400 })

  const db = createServerSupabase()

  const [{ data: reels }, { data: account }] = await Promise.all([
    db.from('reels').select('*').eq('account_id', accountId).order('views', { ascending: false }).limit(30),
    db.from('ig_accounts').select('*').eq('id', accountId).single(),
  ])

  const answer = await chatWithMoka({
    question,
    reels: reels || [],
    accountStats: {
      followers: account?.followers_count,
      username: account?.username,
      total_reels: reels?.length,
    },
  })

  return NextResponse.json({ answer })
}
