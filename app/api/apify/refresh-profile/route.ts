import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { scrapeInstagramUser } from '@/lib/scraper'
import { checkRateLimit } from '@/lib/rateLimit'

export async function POST(req: NextRequest) {
  const accountId = req.cookies.get('ig_account_id')?.value
  if (!accountId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const limit = await checkRateLimit(accountId, 'refresh_profile')
  if (!limit.ok) return NextResponse.json({ error: `Esperá ${limit.retryAfterSeconds}s antes de volver a actualizar` }, { status: 429 })

  const db = createServerSupabase()
  const { data: account } = await db.from('ig_accounts').select('username, apify_session_cookie').eq('id', accountId).single()
  if (!account) return NextResponse.json({ error: 'Cuenta no encontrada' }, { status: 404 })

  try {
    const profile = await scrapeInstagramUser(account.username, account.apify_session_cookie || undefined)
    if (!profile) return NextResponse.json({ error: 'No se pudo traer el perfil' }, { status: 500 })

    await db.from('ig_accounts').update({
      profile_picture_url: profile.profilePicUrl || null,
      followers_count: profile.followersCount,
      media_count: profile.postsCount,
    }).eq('id', accountId)

    return NextResponse.json({ ok: true, profile })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Error actualizando el perfil' }, { status: 500 })
  }
}
