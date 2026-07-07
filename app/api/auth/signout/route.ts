import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// The Supabase session cookies are cleared client-side by supabase.auth.signOut()
// (via the browser client). ig_account_id is httpOnly and set by proxy.ts, so
// client JS can't clear it — this route does that part.
export async function POST() {
  const cookieStore = await cookies()
  cookieStore.delete('ig_account_id')
  return NextResponse.json({ ok: true })
}
