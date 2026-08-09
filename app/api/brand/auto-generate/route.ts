import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { getInstagramProfile } from '@/lib/instagram'
import { autoGenerateBrandDNA } from '@/lib/ai'
import { checkRateLimit } from '@/lib/rateLimit'

export async function POST(req: NextRequest) {
  const accountId = req.cookies.get('ig_account_id')?.value
  if (!accountId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const limit = await checkRateLimit(accountId, 'brand_auto_generate')
  if (!limit.ok) return NextResponse.json({ error: !limit.ok && "message" in limit ? limit.message : `Límite alcanzado. Intentá en ${limit.retryAfterSeconds}s` }, { status: 429 })

  const db = createServerSupabase()

  const { data: account } = await db.from('ig_accounts').select('username, name, ig_access_token').eq('id', accountId).single()
  if (!account) return NextResponse.json({ error: 'Cuenta no encontrada' }, { status: 404 })

  try {
    let profileFetchFailed = false
    // Fetch biography from Graph API if we have a token; skip gracefully for legacy accounts
    const profilePromise = account.ig_access_token
      ? getInstagramProfile(account.ig_access_token).catch(() => { profileFetchFailed = true; return null })
      : Promise.resolve(null)

    const [profile, { data: reels }, { data: competitors }] = await Promise.all([
      profilePromise,
      db.from('reels').select('caption, multiplier, views, hook, structure').eq('account_id', accountId).order('multiplier', { ascending: false }).limit(15),
      db.from('competitors').select('ig_username').eq('account_id', accountId),
    ])

    if (!account.ig_access_token) profileFetchFailed = true

    const topReels = (reels || []).map(r => ({
      caption: r.caption,
      multiplier: r.multiplier || 0,
      views: r.views || 0,
      hook: r.hook,
      narrative_type: (r.structure as Record<string, unknown>)?.narrative_type as string | undefined,
      desire_appealed: (r.structure as Record<string, unknown>)?.desire_appealed as string | undefined,
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
      ...(profileFetchFailed ? { warning: 'No se pudo traer tu bio de Instagram — el resultado se generó solo con tus reels.' } : {}),
    })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error generando ADN de marca' }, { status: 500 })
  }
}
