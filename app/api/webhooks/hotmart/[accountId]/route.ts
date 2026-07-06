import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'

export async function POST(req: NextRequest, { params }: { params: Promise<{ accountId: string }> }) {
  const { accountId } = await params
  const db = createServerSupabase()

  const { data: account } = await db
    .from('ig_accounts')
    .select('id, hotmart_hottok')
    .eq('id', accountId)
    .single()
  if (!account?.hotmart_hottok) return NextResponse.json({ error: 'Cuenta no configurada' }, { status: 404 })

  const body = await req.json()
  // Hotmart verifies via a static token, not an HMAC signature — it's sent
  // as a header on Webhook 2.0, but some older setups still send it in the body.
  const hottok = req.headers.get('x-hotmart-hottok') || body.hottok
  if (hottok !== account.hotmart_hottok) return NextResponse.json({ error: 'Token inválido' }, { status: 401 })

  if (body.event !== 'PURCHASE_COMPLETE' && body.event !== 'PURCHASE_APPROVED') {
    return NextResponse.json({ received: true })
  }

  const purchase = body.data?.purchase
  const trackingCode = purchase?.origin?.sck || purchase?.origin?.src
  const transactionId = purchase?.transaction

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
    external_id: transactionId || `${Date.now()}`,
  }, { onConflict: 'account_id,source,external_id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ received: true })
}
