import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'


export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)
  const code = searchParams.get('code')

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Check if user already has an IG account connected
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const db = (await import('@/lib/supabase')).createServerSupabase()
        const { data: account } = await db
          .from('ig_accounts')
          .select('id')
          .eq('user_id', user.id)
          .single()

        if (account) {
          cookieStore.set('ig_account_id', account.id, { path: '/', maxAge: 60 * 60 * 24 * 365 })
          return NextResponse.redirect(`${origin}/dashboard`)
        }
      }
      return NextResponse.redirect(`${origin}/connect`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
