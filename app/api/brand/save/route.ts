import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const accountId = req.cookies.get('ig_account_id')?.value
  if (!accountId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const body = await req.json()
  const db = createServerSupabase()

  await db.from('brand_dna').upsert({ account_id: accountId, ...body }, { onConflict: 'account_id' })
  return NextResponse.json({ ok: true })
}
