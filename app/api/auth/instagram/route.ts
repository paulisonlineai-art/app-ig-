import { NextRequest, NextResponse } from 'next/server'
import { createAuthServerClient } from '@/lib/supabase-server'

const META_APP_ID = process.env.META_APP_ID || ''
const REDIRECT_URI = process.env.INSTAGRAM_REDIRECT_URI || 'http://localhost:3000/api/auth/instagram/callback'

const SCOPES = [
  'instagram_business_basic',
  'instagram_business_manage_insights',
].join(',')

export async function GET(_req: NextRequest) {
  if (!META_APP_ID) {
    return NextResponse.json({ error: 'META_APP_ID not configured' }, { status: 500 })
  }

  // Use a random state token for CSRF protection (no Supabase user needed yet)
  const state = crypto.randomUUID()

  // Store state in a cookie so the callback can verify it
  const oauthUrl = new URL('https://www.instagram.com/oauth/authorize')
  oauthUrl.searchParams.set('enable_fb_login', '0')
  oauthUrl.searchParams.set('force_authentication', '1')
  oauthUrl.searchParams.set('client_id', META_APP_ID)
  oauthUrl.searchParams.set('redirect_uri', REDIRECT_URI)
  oauthUrl.searchParams.set('scope', SCOPES)
  oauthUrl.searchParams.set('response_type', 'code')
  oauthUrl.searchParams.set('state', state)

  const response = NextResponse.redirect(oauthUrl.toString())
  response.cookies.set('ig_oauth_state', state, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  })

  return response
}
