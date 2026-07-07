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
    if (error) {
      console.error('exchangeCodeForSession failed:', error.message)
      return NextResponse.redirect(`${origin}/login?error=auth_failed&detail=${encodeURIComponent(error.message)}`)
    }

    // middleware.ts resolves the verified ig_account_id cookie from the
    // Supabase session on the next request — it also decides dashboard vs
    // /connect based on whether this user already has an ig_accounts row,
    // so this redirect just needs to land somewhere middleware will route
    // correctly from.
    return NextResponse.redirect(`${origin}/dashboard`)
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed&detail=no_code`)
}
