import { NextRequest, NextResponse } from 'next/server'
import { createAuthServerClient } from '@/lib/supabase-server'
import { createServerSupabase } from '@/lib/supabase'
import { getInstagramProfile } from '@/lib/instagram'

const META_APP_ID = process.env.META_APP_ID || ''
const META_APP_SECRET = process.env.META_APP_SECRET || ''
const REDIRECT_URI = process.env.INSTAGRAM_REDIRECT_URI || 'http://localhost:3000/api/auth/instagram/callback'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')
  const errorReason = searchParams.get('error_reason')

  if (error) {
    const reason = errorReason ?? error
    const redirectUrl = new URL('/connect', req.url)
    redirectUrl.searchParams.set('error', `instagram_denied:${reason}`)
    return NextResponse.redirect(redirectUrl)
  }

  if (!code) {
    return NextResponse.json({ error: 'Missing authorization code' }, { status: 400 })
  }

  // Verify CSRF state
  const storedState = req.cookies.get('ig_oauth_state')?.value
  if (!storedState || storedState !== state) {
    return NextResponse.json({ error: 'Invalid state — posible CSRF' }, { status: 403 })
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
    const expiresInSeconds: number = longTokenData.expires_in ?? 5183944
    const tokenExpiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString()

    // Step 3: Fetch IG profile
    const profile = await getInstagramProfile(longLivedToken)

    // Step 4: Get or create Supabase user
    const db = createServerSupabase()
    const authClient = await createAuthServerClient()
    let { data: { user } } = await authClient.auth.getUser()

    if (!user) {
      const fakeEmail = `${profile.username}@instagram.klar.app`
      const password = `ig_${igUserId}_${META_APP_SECRET.slice(0, 8)}`

      // Check if user already exists (returning user)
      const { data: existingUsers } = await db.auth.admin.listUsers()
      const existing = existingUsers?.users?.find(u => u.email === fakeEmail)

      if (existing) {
        user = existing
      } else {
        const { data: newUser, error: createErr } = await db.auth.admin.createUser({
          email: fakeEmail,
          password,
          email_confirm: true,
          user_metadata: { ig_username: profile.username, full_name: profile.name },
        })
        if (createErr || !newUser.user) {
          console.error('[ig-callback] user creation failed:', createErr)
          throw new Error('No se pudo crear usuario')
        }
        user = newUser.user
      }

      // Sign in to set session cookies
      const { error: signInErr } = await authClient.auth.signInWithPassword({
        email: fakeEmail,
        password,
      })
      if (signInErr) {
        // If password doesn't match (user existed with different password), reset it
        await db.auth.admin.updateUserById(user.id, { password })
        await authClient.auth.signInWithPassword({ email: fakeEmail, password })
      }
    }

    // Step 5: Upsert ig_accounts
    const accountData = {
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
      legacy_access_token: 'oauth',
    }

    const { error: insertError } = await db
      .from('ig_accounts')
      .upsert(accountData, { onConflict: 'ig_user_id' })

    if (insertError) {
      console.error('[ig-callback] DB insert failed:', insertError)
      throw new Error(insertError.message)
    }

    // Clear the OAuth state cookie
    const response = NextResponse.redirect(new URL('/marca?onboarding=1', req.url))
    response.cookies.delete('ig_oauth_state')
    return response
  } catch (e: unknown) {
    console.error('[ig-callback] OAuth error:', e)
    const redirectUrl = new URL('/connect', req.url)
    redirectUrl.searchParams.set('error', e instanceof Error ? e.message : 'Error conectando con Instagram')
    return NextResponse.redirect(redirectUrl)
  }
}
