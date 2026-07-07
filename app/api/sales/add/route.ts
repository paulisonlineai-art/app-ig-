import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'

const ALLOWED_FIELDS = ['amount', 'installments', 'amount_per_installment', 'cash_collected', 'pending_amount', 'closed_at', 'reel_id', 'story_id', 'notes'] as const

export async function POST(req: NextRequest) {
  const accountId = req.cookies.get('ig_account_id')?.value
  if (!accountId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const body = await req.json()
  const fields: Record<string, any> = {}
  for (const key of ALLOWED_FIELDS) if (key in body) fields[key] = body[key]

  const db = createServerSupabase()

  const { data, error } = await db
    .from('sales')
    .insert({ ...fields, account_id: accountId, source: 'manual' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ sale: data })
}
