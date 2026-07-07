import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

// Paths that never require a Google session at all.
const PUBLIC_PATHS = new Set(['/', '/login', '/auth/callback'])
const PUBLIC_PREFIXES = ['/api/webhooks/', '/api/cron/']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (PUBLIC_PATHS.has(pathname) || PUBLIC_PREFIXES.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  const isApi = pathname.startsWith('/api/')
  let response = NextResponse.next({ request: req })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value))
          response = NextResponse.next({ request: req })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    }
  )

  // This validates the Supabase session JWT cryptographically — unlike the
  // old model, nothing here can be forged by just setting a cookie value.
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    if (isApi) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    return NextResponse.redirect(new URL('/login', req.url))
  }

  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data: account } = await db.from('ig_accounts').select('id').eq('user_id', user.id).single()

  // These are how a not-yet-connected but already-logged-in user creates
  // their ig_accounts row — they must NOT be gated behind "already has one".
  if (pathname === '/connect' || pathname === '/api/apify/connect') {
    if (pathname === '/connect' && account) return NextResponse.redirect(new URL('/dashboard', req.url))
    return response
  }

  if (!account) {
    if (isApi) return NextResponse.json({ error: 'Cuenta no conectada' }, { status: 401 })
    return NextResponse.redirect(new URL('/connect', req.url))
  }

  // Re-derive ig_account_id from the verified session on every request —
  // this cookie is no longer a bare client-settable value routes just trust.
  response.cookies.set('ig_account_id', account.id, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365,
  })

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
