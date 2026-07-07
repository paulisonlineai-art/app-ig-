import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'

const ALLOWED_FIELDS = ['title', 'content_type', 'status', 'target_publish_date', 'platform', 'script', 'raw_video_url', 'edited_video_url', 'reference_video_url', 'reel_id', 'position'] as const

export async function PATCH(req: NextRequest) {
  const accountId = req.cookies.get('ig_account_id')?.value
  if (!accountId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const body = await req.json()
  const { id } = body
  const updates: Record<string, any> = {}
  for (const key of ALLOWED_FIELDS) if (key in body) updates[key] = body[key]

  const db = createServerSupabase()

  const { error } = await db
    .from('content_pieces')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('account_id', accountId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
