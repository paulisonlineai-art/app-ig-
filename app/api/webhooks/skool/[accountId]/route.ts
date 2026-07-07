import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { secureCompare } from '@/lib/secureCompare'

// Skool has no webhooks or public API of its own — this is meant to be
// called from a Zapier "new paid member" automation. Since that event
// carries no reel/attribution data, sales land unattributed (reel_id null)
// and use the account's fixed membership price, since Zapier's trigger
// doesn't reliably expose the amount paid either.
export async function POST(req: NextRequest, { params }: { params: Promise<{ accountId: string }> }) {
  const { accountId } = await params
  const db = createServerSupabase()

  const { data: account } = await db
    .from('ig_accounts')
    .select('id, skool_webhook_secret, skool_fixed_price')
    .eq('id', accountId)
    .single()

  const auth = (req.headers.get('authorization') || '').replace(/^Bearer /, '')

  // Same generic response for "account not configured" and "wrong secret" —
  // avoids leaking which accountId UUIDs have Skool set up.
  if (!account?.skool_webhook_secret || !secureCompare(auth, account.skool_webhook_secret)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  if (!account.skool_fixed_price) return NextResponse.json({ error: 'Falta configurar el precio fijo de Skool' }, { status: 400 })

  const body = await req.json().catch(() => ({}))
  const memberId = body.member_id || body.email || `${Date.now()}`

  const amount = account.skool_fixed_price
  const { error } = await db.from('sales').upsert({
    account_id: accountId,
    amount,
    installments: 1,
    amount_per_installment: amount,
    cash_collected: amount,
    pending_amount: 0,
    closed_at: new Date().toISOString().split('T')[0],
    reel_id: null,
    source: 'skool',
    external_id: String(memberId),
  }, { onConflict: 'account_id,source,external_id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ received: true })
}
