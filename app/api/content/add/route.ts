import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'

const ALLOWED_FIELDS = ['title', 'content_type', 'status', 'target_publish_date', 'platform', 'script', 'raw_video_url', 'edited_video_url', 'reference_video_url', 'reel_id'] as const

export async function POST(req: NextRequest) {
  const accountId = req.cookies.get('ig_account_id')?.value
  if (!accountId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const body = await req.json()
  const fields: Record<string, any> = {}
  for (const key of ALLOWED_FIELDS) if (key in body) fields[key] = body[key]

  const db = createServerSupabase()

  const { count } = await db.from('content_pieces').select('*', { count: 'exact', head: true }).eq('account_id', accountId)

  const { data, error } = await db
    .from('content_pieces')
    .insert({ ...fields, account_id: accountId, position: (count || 0) + 1 })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ piece: data })
}
