import { NextRequest, NextResponse } from 'next/server'
import { exchangeCodeForToken, getLongLivedToken, getUserPages, getIGAccountFromPage, getIGUserProfile } from '@/lib/instagram'
import { createServerSupabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error || !code) {
    return NextResponse.redirect(new URL('/auth?error=denied', req.url))
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/instagram/callback`

  try {
    // Exchange code for short-lived token
    const tokenData = await exchangeCodeForToken(code, redirectUri)
    if (tokenData.error) throw new Error(tokenData.error.message)

    // Get long-lived token (60 days)
    const longToken = await getLongLivedToken(tokenData.access_token)
    if (longToken.error) throw new Error(longToken.error.message)

    const accessToken = longToken.access_token
    const expiresAt = new Date(Date.now() + longToken.expires_in * 1000).toISOString()

    // Get Facebook pages and linked IG accounts
    const pages = await getUserPages(accessToken)
    let igAccount = null

    for (const page of pages.data || []) {
      const igAccounts = await getIGAccountFromPage(page.access_token, page.id)
      if (igAccounts.data?.[0]) {
        igAccount = { ...igAccounts.data[0], pageAccessToken: page.access_token }
        break
      }
    }

    if (!igAccount) {
      return NextResponse.redirect(new URL('/auth?error=no_ig_account', req.url))
    }

    // Save to Supabase
    const db = createServerSupabase()
    const { data, error: dbError } = await db
      .from('ig_accounts')
      .upsert({
        ig_user_id: igAccount.id,
        username: igAccount.username,
        name: igAccount.name,
        profile_picture_url: igAccount.profile_picture_url,
        followers_count: igAccount.followers_count,
        access_token: accessToken,
        token_expires_at: expiresAt,
      }, { onConflict: 'ig_user_id' })
      .select()
      .single()

    if (dbError) throw dbError

    // Redirect to dashboard
    const response = NextResponse.redirect(new URL('/dashboard', req.url))
    response.cookies.set('ig_account_id', data.id, { httpOnly: true, path: '/', maxAge: 60 * 60 * 24 * 60 })
    return response

  } catch (err) {
    console.error('OAuth error:', err)
    return NextResponse.redirect(new URL('/auth?error=oauth_failed', req.url))
  }
}
