import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { getOrCreateTrackingCode } from '@/lib/tracking'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const accountId = req.cookies.get('ig_account_id')?.value
  if (!accountId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { id } = await params
  const db = createServerSupabase()

  const { data: reel } = await db.from('reels').select('id').eq('id', id).eq('account_id', accountId).single()
  if (!reel) return NextResponse.json({ error: 'Reel no encontrado' }, { status: 404 })

  const { data: account } = await db
    .from('ig_accounts')
    .select('stripe_payment_link_base, hotmart_checkout_url_base')
    .eq('id', accountId)
    .single()

  try {
    const trackingCode = await getOrCreateTrackingCode(db, id)

    const withParam = (base: string | null | undefined, param: string) => {
      if (!base) return null
      const sep = base.includes('?') ? '&' : '?'
      return `${base}${sep}${param}=${trackingCode}`
    }

    return NextResponse.json({
      trackingCode,
      stripeLink: withParam(account?.stripe_payment_link_base, 'client_reference_id'),
      hotmartLink: withParam(account?.hotmart_checkout_url_base, 'sck'),
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Error generando el link' }, { status: 500 })
  }
}
