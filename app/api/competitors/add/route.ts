import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const accountId = req.cookies.get('ig_account_id')?.value
  if (!accountId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { username } = await req.json()
  if (!username) return NextResponse.json({ error: 'Username required' }, { status: 400 })

  const db = createServerSupabase()

  // Check if already exists
  const { data: existing } = await db
    .from('competitors')
    .select('id')
    .eq('account_id', accountId)
    .eq('ig_username', username)
    .single()

  if (existing) return NextResponse.json({ error: 'Ya estás trackeando este competidor' }, { status: 400 })

  const { data, error } = await db
    .from('competitors')
    .insert({ account_id: accountId, ig_username: username })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ competitor: data })
}
