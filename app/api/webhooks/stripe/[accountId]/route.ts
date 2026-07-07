import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerSupabase } from '@/lib/supabase'

export async function POST(req: NextRequest, { params }: { params: Promise<{ accountId: string }> }) {
  const { accountId } = await params
  const db = createServerSupabase()

  const { data: account } = await db
    .from('ig_accounts')
    .select('id, stripe_webhook_secret')
    .eq('id', accountId)
    .single()
  // Same generic response whether the account isn't configured or the
  // signature is wrong — avoids leaking which accountId UUIDs have Stripe set up.
  if (!account?.stripe_webhook_secret) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const sig = req.headers.get('stripe-signature')
  const rawBody = await req.text()

  let event: Stripe.Event
  try {
    // No API calls are made against Stripe here — the client only verifies
    // the webhook signature, so a placeholder API key is fine.
    const stripe = new Stripe('sk_placeholder')
    event = stripe.webhooks.constructEvent(rawBody, sig || '', account.stripe_webhook_secret)
  } catch (e: any) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  if (event.type !== 'checkout.session.completed') return NextResponse.json({ received: true })

  const session = event.data.object as Stripe.Checkout.Session
  const trackingCode = session.client_reference_id

  let reelId: string | null = null
  if (trackingCode) {
    const { data: reel } = await db.from('reels').select('id').eq('account_id', accountId).eq('tracking_code', trackingCode).single()
    reelId = reel?.id || null
  }

  const amount = (session.amount_total || 0) / 100
  const { error } = await db.from('sales').upsert({
    account_id: accountId,
    amount,
    installments: 1,
    amount_per_installment: amount,
    cash_collected: amount,
    pending_amount: 0,
    closed_at: new Date().toISOString().split('T')[0],
    reel_id: reelId,
    source: 'stripe',
    external_id: session.id,
  }, { onConflict: 'account_id,source,external_id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ received: true })
}
