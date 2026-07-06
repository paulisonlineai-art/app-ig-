import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'

const ALLOWED_FIELDS = [
  'stripe_webhook_secret',
  'hotmart_hottok',
  'skool_webhook_secret',
  'stripe_payment_link_base',
  'hotmart_checkout_url_base',
  'skool_fixed_price',
] as const

export async function POST(req: NextRequest) {
  const accountId = req.cookies.get('ig_account_id')?.value
  if (!accountId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const body = await req.json()
  const update: Record<string, any> = {}
  for (const key of ALLOWED_FIELDS) {
    if (key in body) update[key] = body[key] || null
  }

  const db = createServerSupabase()
  const { error } = await db.from('ig_accounts').update(update).eq('id', accountId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
