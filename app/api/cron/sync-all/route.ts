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

  // Sequential, not Promise.all — Apify's usage cap is shared across every
  // account, so running N accounts' syncs (2 Apify calls each) all at once
  // is what actually exhausts the monthly quota in one burst. If Apify is
  // already out of quota, every remaining account would fail identically,
  // so stop early instead of burning through the whole list for nothing.
  const results: any[] = []
  for (const account of accounts) {
    try {
      const result = await syncAccountReels(account.id)
      results.push({ username: account.username, ...result })
    } catch (e: any) {
      results.push({ username: account.username, error: e.message })
      if (/usage.*limit|quota/i.test(e.message || '')) {
        results.push({ stopped: true, reason: 'Apify usage limit hit — skipping remaining accounts' })
        break
      }
    }
  }

  return NextResponse.json({ accounts: accounts.length, results })
}
