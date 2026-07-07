import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { secureCompare } from '@/lib/secureCompare'

export async function POST(req: NextRequest, { params }: { params: Promise<{ accountId: string }> }) {
  const { accountId } = await params
  const db = createServerSupabase()

  const { data: account } = await db
    .from('ig_accounts')
    .select('id, hotmart_hottok')
    .eq('id', accountId)
    .single()

  const body = await req.json().catch(() => ({}))
  // Hotmart verifies via a static token, not an HMAC signature — it's sent
  // as a header on Webhook 2.0, but some older setups still send it in the body.
  const hottok = req.headers.get('x-hotmart-hottok') || body.hottok || ''

  // Same generic response whether the account doesn't exist, isn't
  // configured, or the token is wrong — distinguishing them would let
  // someone probe which accountId UUIDs actually have Hotmart set up.
  if (!account?.hotmart_hottok || !secureCompare(hottok, account.hotmart_hottok)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  if (body.event !== 'PURCHASE_COMPLETE' && body.event !== 'PURCHASE_APPROVED') {
    return NextResponse.json({ received: true })
  }

  const purchase = body.data?.purchase
  const trackingCode = purchase?.origin?.sck || purchase?.origin?.src
  const transactionId = purchase?.transaction

  // Without a real transaction id there's no way to dedupe retried/replayed
  // deliveries — a synthetic fallback (e.g. Date.now()) would just create a
  // new "unique" id every time and silently double-count the sale instead.
  if (!transactionId) return NextResponse.json({ error: 'Falta purchase.transaction' }, { status: 400 })

  let reelId: string | null = null
  if (trackingCode) {
    const { data: reel } = await db.from('reels').select('id').eq('account_id', accountId).eq('tracking_code', trackingCode).single()
    reelId = reel?.id || null
  }

  const amount = purchase?.price?.value || 0
  const { error } = await db.from('sales').upsert({
    account_id: accountId,
    amount,
    installments: 1,
    amount_per_installment: amount,
    cash_collected: amount,
    pending_amount: 0,
    closed_at: new Date().toISOString().split('T')[0],
    reel_id: reelId,
    source: 'hotmart',
    external_id: transactionId,
  }, { onConflict: 'account_id,source,external_id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ received: true })
}
