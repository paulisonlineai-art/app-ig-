import { NextRequest, NextResponse } from 'next/server'
import { createAuthServerClient } from '@/lib/supabase-server'
import { createServerSupabase } from '@/lib/supabase'

/**
 * GET /api/instagram/connect
 * Check whether the current user has a connected Instagram account with a valid token.
 */
export async function GET() {
  const authClient = await createAuthServerClient()
  const {
    data: { user },
  } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const db = createServerSupabase()
  const { data: account } = await db
    .from('ig_accounts')
    .select('id, ig_access_token, ig_token_expires_at')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!account || !account.ig_access_token) {
    return NextResponse.json({ connected: false }, { status: 404 })
  }

  // Check token expiry
  const expired =
    account.ig_token_expires_at && new Date(account.ig_token_expires_at) < new Date()

  return NextResponse.json({ connected: !expired, token_expired: !!expired })
}

/**
 * POST /api/instagram/connect
 * Initiates the Meta OAuth flow by returning the redirect URL.
 * The client should navigate to the returned URL.
 */
export async function POST(_req: NextRequest) {
  const authClient = await createAuthServerClient()
  const {
    data: { user },
  } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  return NextResponse.json({ redirect_to: '/api/auth/instagram' })
}
