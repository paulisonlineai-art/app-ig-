import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerSupabase } from '@/lib/supabase'
import { createAuthServerClient } from '@/lib/supabase-server'
import { scrapeInstagramUser } from '@/lib/apify'

export async function POST(req: NextRequest) {
  const { username, sessionCookie } = await req.json()
  if (!username) return NextResponse.json({ error: 'Username requerido' }, { status: 400 })

  // Get logged-in user (optional — works without Google login too)
  let userId: string | null = null
  try {
    const authClient = await createAuthServerClient()
    const { data: { user } } = await authClient.auth.getUser()
    userId = user?.id || null
  } catch {}

  try {
    const profile = await scrapeInstagramUser(username.replace('@', ''), sessionCookie)
    if (!profile) return NextResponse.json({ error: 'No se pudo obtener el perfil. Verificá el username.' }, { status: 404 })

    const db = createServerSupabase()
    const { data: account, error } = await db
      .from('ig_accounts')
      .upsert({
        ig_user_id: profile.id || profile.username,
        username: profile.username,
        name: profile.fullName,
        profile_picture_url: profile.profilePicUrl,
        followers_count: profile.followersCount,
        media_count: profile.postsCount,
        access_token: sessionCookie || 'apify_no_token',
        data_source: 'apify',
        apify_session_cookie: sessionCookie || null,
        ...(userId ? { user_id: userId } : {}),
      }, { onConflict: 'ig_user_id' })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const cookieStore = await cookies()
    cookieStore.set('ig_account_id', account.id, { path: '/', maxAge: 60 * 60 * 24 * 365 })

    return NextResponse.json({ success: true, account })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Error conectando con Apify' }, { status: 500 })
  }
}
