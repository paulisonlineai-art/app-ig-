import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { syncAccountReels } from '@/lib/sync'

export const maxDuration = 300

// Triggered daily by Vercel Cron (see vercel.json). Vercel signs cron requests
// with `Authorization: Bearer $CRON_SECRET` — reject anything else so this
// endpoint can't be used to trigger syncs (and burn Apify credits) publicly.
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const db = createServerSupabase()
  const { data: accounts } = await db.from('ig_accounts').select('id, username')
  if (!accounts?.length) return NextResponse.json({ synced: 0, accounts: 0 })

  const results = await Promise.all(
    accounts.map(async account => {
      try {
        const result = await syncAccountReels(account.id)
        return { username: account.username, ...result }
      } catch (e: any) {
        return { username: account.username, error: e.message }
      }
    })
  )

  return NextResponse.json({ accounts: accounts.length, results })
}
