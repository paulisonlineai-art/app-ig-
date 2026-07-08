import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const accountId = req.cookies.get('ig_account_id')?.value
  if (!accountId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { reelId, saved } = await req.json()
  if (!reelId || typeof saved !== 'boolean') return NextResponse.json({ error: 'Parámetros faltantes' }, { status: 400 })

  const db = createServerSupabase()

  const { data: reel } = await db
    .from('competitor_reels')
    .select('id, competitor_id, competitors!inner(account_id)')
    .eq('id', reelId)
    .eq('competitors.account_id', accountId)
    .single()

  if (!reel) return NextResponse.json({ error: 'Reel no encontrado' }, { status: 404 })

  const { error } = await db.from('competitor_reels').update({ saved }).eq('id', reelId).eq('competitor_id', reel.competitor_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
