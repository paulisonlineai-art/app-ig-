import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { scrapeInstagramUser } from '@/lib/apify'
import { autoGenerateBrandDNA } from '@/lib/ai'
import { checkRateLimit } from '@/lib/rateLimit'

export async function POST(req: NextRequest) {
  const accountId = req.cookies.get('ig_account_id')?.value
  if (!accountId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const limit = await checkRateLimit(accountId, 'brand_auto_generate')
  if (!limit.ok) return NextResponse.json({ error: `Esperá ${limit.retryAfterSeconds}s antes de volver a generar` }, { status: 429 })

  const db = createServerSupabase()

  const { data: account } = await db.from('ig_accounts').select('username, name').eq('id', accountId).single()
  if (!account) return NextResponse.json({ error: 'Cuenta no encontrada' }, { status: 404 })

  try {
    let profileFetchFailed = false
    const [profile, { data: reels }, { data: competitors }] = await Promise.all([
      scrapeInstagramUser(account.username).catch(() => { profileFetchFailed = true; return null }),
      db.from('reels').select('caption, multiplier, views, hook, structure').eq('account_id', accountId).order('multiplier', { ascending: false }).limit(15),
      db.from('competitors').select('ig_username').eq('account_id', accountId),
    ])

    const topReels = (reels || []).map(r => ({
      caption: r.caption,
      multiplier: r.multiplier || 0,
      views: r.views || 0,
      hook: r.hook,
      narrative_type: (r.structure as any)?.narrative_type,
      desire_appealed: (r.structure as any)?.desire_appealed,
    }))

    const fields = await autoGenerateBrandDNA({
      username: account.username,
      fullName: account.name || '',
      biography: profile?.biography || '',
      topReels,
      competitorUsernames: (competitors || []).map(c => c.ig_username),
    })

    return NextResponse.json({
      fields,
      ...(profileFetchFailed ? { warning: 'No se pudo traer tu bio de Instagram (Apify falló) — el resultado se generó solo con tus reels.' } : {}),
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Error generando ADN de marca' }, { status: 500 })
  }
}
