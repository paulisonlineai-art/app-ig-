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
  // A Google session is required — without it there is no way to tie an
  // Instagram username (just public text, not proof of ownership) to a real
  // person, and nothing stops one user from "connecting" someone else's
  // already-connected account and reading their dashboard.
  const authClient = await createAuthServerClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { username, sessionCookie } = await req.json()
  if (!username) return NextResponse.json({ error: 'Username requerido' }, { status: 400 })

  try {
    const profile = await scrapeInstagramUser(username.replace('@', ''), sessionCookie)
    if (!profile) return NextResponse.json({ error: 'No se pudo obtener el perfil. Verificá el username.' }, { status: 404 })

    const db = createServerSupabase()
    const igUserId = profile.id || profile.username

    // If this Instagram profile is already connected to a DIFFERENT Klar
    // user, refuse — never let a request silently overwrite someone else's
    // account_id/access_token just by knowing their public username.
    const { data: existingByIg } = await db.from('ig_accounts').select('id, user_id').eq('ig_user_id', igUserId).maybeSingle()
    if (existingByIg && existingByIg.user_id && existingByIg.user_id !== user.id) {
      return NextResponse.json({ error: 'Esta cuenta de Instagram ya está conectada a otro usuario de Klar.' }, { status: 409 })
    }

    const fields = {
      ig_user_id: igUserId,
      username: profile.username,
      name: profile.fullName,
      profile_picture_url: profile.profilePicUrl,
      followers_count: profile.followersCount,
      media_count: profile.postsCount,
      access_token: sessionCookie || 'apify_no_token',
      data_source: 'apify',
      apify_session_cookie: sessionCookie || null,
      user_id: user.id,
    }

    // Update this user's own existing row if they have one (lets them
    // reconnect/change username), otherwise create a new row for them.
    const { data: existingForUser } = await db.from('ig_accounts').select('id').eq('user_id', user.id).maybeSingle()
    const { error } = existingForUser
      ? await db.from('ig_accounts').update(fields).eq('id', existingForUser.id)
      : await db.from('ig_accounts').insert(fields)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // No access_token/apify_session_cookie in the response — those are real
    // Instagram session credentials and shouldn't ever reach client JS.
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Error conectando con Apify' }, { status: 500 })
  }
}
