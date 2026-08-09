import { NextRequest, NextResponse } from 'next/server'
import { createAuthServerClient } from '@/lib/supabase-server'
import { createServerSupabase } from '@/lib/supabase'
import { getInstagramProfile } from '@/lib/instagram'

const META_APP_ID = process.env.META_APP_ID || ''
const META_APP_SECRET = process.env.META_APP_SECRET || ''
const REDIRECT_URI = process.env.INSTAGRAM_REDIRECT_URI || 'http://localhost:3000/api/auth/instagram/callback'

/**
 * GET /api/auth/instagram/callback
 * Handles the Meta OAuth callback after user grants permissions.
 *
 * Flow:
 *  1. Validate state param (Supabase user ID) to prevent CSRF
 *  2. Exchange `code` for a short-lived token
 *  3. Exchange short-lived → long-lived token (60-day TTL)
 *  4. Fetch IG profile (id, username, name, etc.)
 *  5. Upsert ig_accounts row with token + profile data
 *  6. Redirect to /marca?onboarding=1
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')
  const errorReason = searchParams.get('error_reason')

  // User denied permissions
  if (error) {
    const reason = errorReason ?? error
    const redirectUrl = new URL('/connect', req.url)
    redirectUrl.searchParams.set('error', `instagram_denied:${reason}`)
    return NextResponse.redirect(redirectUrl)
  }

  if (!code) {
    return NextResponse.json({ error: 'Missing authorization code' }, { status: 400 })
  }

  // Validate state — must match the logged-in user's Supabase UID
  const authClient = await createAuthServerClient()
  const {
    data: { user },
  } = await authClient.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/connect', req.url))
  }

  if (state !== user.id) {
    return NextResponse.json({ error: 'Invalid state parameter — possible CSRF attempt' }, { status: 403 })
  }

  try {
    // Step 1: Exchange code for short-lived token
    const tokenFormData = new URLSearchParams({
      client_id: META_APP_ID,
      client_secret: META_APP_SECRET,
      grant_type: 'authorization_code',
      redirect_uri: REDIRECT_URI,
      code,
    })

    const shortTokenRes = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenFormData.toString(),
      signal: AbortSignal.timeout(15000),
    })

    const shortTokenData = await shortTokenRes.json()
    if (!shortTokenRes.ok || shortTokenData.error_type) {
      console.error('[ig-callback] short-lived token exchange failed:', shortTokenData)
      throw new Error(shortTokenData.error_message ?? 'Failed to exchange authorization code')
    }

    const shortLivedToken: string = shortTokenData.access_token
    const igUserId: string = String(shortTokenData.user_id)

    // Step 2: Exchange short-lived → long-lived token (60 days)
    const longTokenUrl = new URL('https://graph.instagram.com/access_token')
    longTokenUrl.searchParams.set('grant_type', 'ig_exchange_token')
    longTokenUrl.searchParams.set('client_secret', META_APP_SECRET)
    longTokenUrl.searchParams.set('access_token', shortLivedToken)

    const longTokenRes = await fetch(longTokenUrl.toString(), {
      signal: AbortSignal.timeout(15000),
    })
    const longTokenData = await longTokenRes.json()

    if (!longTokenRes.ok || longTokenData.error) {
      console.error('[ig-callback] long-lived token exchange failed:', longTokenData)
      throw new Error(longTokenData.error?.message ?? 'Failed to get long-lived token')
    }

    const longLivedToken: string = longTokenData.access_token
    const expiresInSeconds: number = longTokenData.expires_in ?? 5183944 // ~60 days
    const tokenExpiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString()

    // Step 3: Fetch IG profile
    const profile = await getInstagramProfile(longLivedToken)

    const db = createServerSupabase()

    // Check if this IG account is already connected to a different user
    const { data: existingByIgId } = await db
      .from('ig_accounts')
      .select('id, user_id')
      .eq('ig_user_id', profile.id)
      .maybeSingle()

    if (existingByIgId && existingByIgId.user_id && existingByIgId.user_id !== user.id) {
      const redirectUrl = new URL('/connect', req.url)
      redirectUrl.searchParams.set('error', 'Esta cuenta de Instagram ya está conectada a otro usuario de Klar.')
      return NextResponse.redirect(redirectUrl)
    }

    // Step 4: Upsert ig_accounts
    const igAccountFields = {
      user_id: user.id,
      ig_user_id: profile.id,
      ig_user_id_numeric: parseInt(igUserId, 10) || null,
      ig_account_type: profile.account_type as 'BUSINESS' | 'CREATOR' | 'PERSONAL',
      username: profile.username,
      name: profile.name || '',
      profile_picture_url: profile.profile_picture_url || null,
      followers_count: profile.followers_count,
      media_count: profile.media_count,
      ig_access_token: longLivedToken,
      ig_token_expires_at: tokenExpiresAt,
    }

    const { data: existingForUser } = await db
      .from('ig_accounts')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    const { error: upsertError } = existingForUser
      ? await db.from('ig_accounts').update(igAccountFields).eq('id', existingForUser.id)
      : await db.from('ig_accounts').insert(igAccountFields)

    if (upsertError) {
      console.error('[ig-callback] DB upsert failed:', upsertError)
      throw new Error(upsertError.message)
    }

    // Success — redirect to onboarding
    return NextResponse.redirect(new URL('/marca?onboarding=1', req.url))
  } catch (e: unknown) {
    console.error('[ig-callback] OAuth error:', e)
    const redirectUrl = new URL('/connect', req.url)
    redirectUrl.searchParams.set('error', e instanceof Error ? e.message : 'Error conectando con Instagram')
    return NextResponse.redirect(redirectUrl)
  }
}
