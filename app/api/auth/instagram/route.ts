import { NextRequest, NextResponse } from 'next/server'
import { createAuthServerClient } from '@/lib/supabase-server'

const META_APP_ID = process.env.META_APP_ID || ''
const REDIRECT_URI = process.env.INSTAGRAM_REDIRECT_URI || 'http://localhost:3000/api/auth/instagram/callback'

const SCOPES = [
  'instagram_business_basic',
  'instagram_business_manage_insights',
  'instagram_business_manage_comments',
  'instagram_business_content_publish',
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

  // Instagram Business Login — match Meta's own generated URL format
  const oauthUrl = new URL('https://www.instagram.com/oauth/authorize')
  oauthUrl.searchParams.set('force_reauth', 'true')
  oauthUrl.searchParams.set('client_id', META_APP_ID)
  oauthUrl.searchParams.set('redirect_uri', REDIRECT_URI)
  oauthUrl.searchParams.set('scope', SCOPES)
  oauthUrl.searchParams.set('response_type', 'code')
  // Pass Supabase user ID as state for CSRF protection
  oauthUrl.searchParams.set('state', user.id)

  return NextResponse.redirect(oauthUrl.toString())
}
