import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { getInstagramProfile } from '@/lib/instagram'
import { checkRateLimit } from '@/lib/rateLimit'

/**
 * POST /api/instagram/refresh-profile
 * Refreshes the user's Instagram profile data (avatar, followers, name)
 * using their stored Graph API access token.
 */
export async function POST(req: NextRequest) {
  const accountId = req.cookies.get('ig_account_id')?.value
  if (!accountId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const limit = await checkRateLimit(accountId, 'refresh_profile')
  if (!limit.ok) {
    return NextResponse.json(
      {
        error:
          !limit.ok && 'message' in limit
            ? limit.message
            : `Límite alcanzado. Intentá en ${limit.retryAfterSeconds}s`,
      },
      { status: 429 },
    )
  }

  const db = createServerSupabase()
  const { data: account } = await db
    .from('ig_accounts')
    .select('ig_access_token')
    .eq('id', accountId)
    .single()

  if (!account) return NextResponse.json({ error: 'Cuenta no encontrada' }, { status: 404 })
  if (!account.ig_access_token) {
    return NextResponse.json(
      { error: 'Cuenta no autenticada con Instagram Graph API. Por favor reconectá tu cuenta.' },
      { status: 401 },
    )
  }

  try {
    const profile = await getInstagramProfile(account.ig_access_token)

    await db
      .from('ig_accounts')
      .update({
        profile_picture_url: profile.profile_picture_url || null,
        followers_count: profile.followers_count,
        media_count: profile.media_count,
        name: profile.name || null,
        ig_account_type: profile.account_type,
      })
      .eq('id', accountId)

    return NextResponse.json({ ok: true, profile })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Error actualizando el perfil'
    const isExpired = e instanceof Error && e.name === 'IGExpiredTokenError'
    return NextResponse.json({ error: msg, code: isExpired ? 'token_expired' : undefined }, {
      status: isExpired ? 401 : 500,
    })
  }
}
