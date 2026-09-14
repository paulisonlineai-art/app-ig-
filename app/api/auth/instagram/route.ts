import { NextRequest, NextResponse } from 'next/server'
import { createAuthServerClient } from '@/lib/supabase-server'

const META_APP_ID = process.env.META_APP_ID || ''
const REDIRECT_URI = process.env.INSTAGRAM_REDIRECT_URI || 'http://localhost:3000/api/auth/instagram/callback'

const SCOPES = [
  'instagram_business_basic',
  'instagram_business_manage_insights',
].join(',')

/**
 * GET /api/auth/instagram
 * Initiates the Meta OAuth flow. User must already be signed in with Google/Supabase.
 * Redirects to Meta's OAuth dialog.
 */
export async function GET(_req: NextRequest) {
  const authClient = await createAuthServerClient()
  const {
    data: { user },
  } = await authClient.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/connect', _req.url))
  }

  if (!META_APP_ID) {
    return NextResponse.json({ error: 'META_APP_ID not configured' }, { status: 500 })
  }

  // Instagram Business Login
  const oauthUrl = new URL('https://www.instagram.com/oauth/authorize')
  oauthUrl.searchParams.set('enable_fb_login', '0')
  oauthUrl.searchParams.set('force_authentication', '1')
  oauthUrl.searchParams.set('client_id', META_APP_ID)
  oauthUrl.searchParams.set('redirect_uri', REDIRECT_URI)
  oauthUrl.searchParams.set('scope', SCOPES)
  oauthUrl.searchParams.set('response_type', 'code')
  oauthUrl.searchParams.set('state', user.id)

  return NextResponse.redirect(oauthUrl.toString())
}
