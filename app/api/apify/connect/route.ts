import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { createAuthServerClient } from '@/lib/supabase-server'
import { scrapeInstagramUser } from '@/lib/scraper'

export async function GET() {
  const authClient = await createAuthServerClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const db = createServerSupabase()
  const { data: account } = await db.from('ig_accounts').select('id').eq('user_id', user.id).maybeSingle()
  if (!account) return NextResponse.json({ error: 'No conectado' }, { status: 404 })
  return NextResponse.json({ connected: true })
}

export async function POST(req: NextRequest) {
  const authClient = await createAuthServerClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { username, sessionCookie } = await req.json()
  if (!username) return NextResponse.json({ error: 'Username requerido' }, { status: 400 })

  const cleanUsername = username.replace('@', '').trim().toLowerCase()
  if (!cleanUsername || cleanUsername.length < 2) {
    return NextResponse.json({ error: 'Username inválido' }, { status: 400 })
  }

  try {
    const db = createServerSupabase()

    // Check if this username is already connected to a different user
    const { data: existingByUsername } = await db.from('ig_accounts')
      .select('id, user_id').eq('username', cleanUsername).maybeSingle()
    if (existingByUsername && existingByUsername.user_id && existingByUsername.user_id !== user.id) {
      return NextResponse.json({ error: 'Esta cuenta de Instagram ya está conectada a otro usuario de Klar.' }, { status: 409 })
    }

    // Try to get profile data (best effort — not required to connect)
    const profile = await scrapeInstagramUser(cleanUsername, sessionCookie)

    const fields = {
      ig_user_id: profile?.id || cleanUsername,
      username: profile?.username || cleanUsername,
      name: profile?.fullName || '',
      profile_picture_url: profile?.profilePicUrl || null,
      followers_count: profile?.followersCount || 0,
      media_count: profile?.postsCount || 0,
      access_token: sessionCookie || 'no_token',
      data_source: 'scraper',
      apify_session_cookie: sessionCookie || null,
      user_id: user.id,
    }

    const { data: existingForUser } = await db.from('ig_accounts').select('id').eq('user_id', user.id).maybeSingle()
    const { error } = existingForUser
      ? await db.from('ig_accounts').update(fields).eq('id', existingForUser.id)
      : await db.from('ig_accounts').insert(fields)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true, profileFound: !!profile })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Error conectando' }, { status: 500 })
  }
}
