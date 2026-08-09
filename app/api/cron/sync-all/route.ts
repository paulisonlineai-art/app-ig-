import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { syncAccountReels } from '@/lib/sync'

export const maxDuration = 300

// Triggered daily by Vercel Cron (see vercel.json). Vercel signs cron requests
// with `Authorization: Bearer $CRON_SECRET` — reject anything else so this
// endpoint can't be used to trigger syncs publicly.
//
// Graph API rate limit: 200 calls/user/hour. We add a 500ms delay between
// accounts to avoid bursting the shared quota. Each sync uses ~50 media calls
// + 50 insight calls = ~100 calls per account.
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const db = createServerSupabase()

  // Only sync accounts that have a valid Graph API token
  const { data: accounts } = await db
    .from('ig_accounts')
    .select('id, username, ig_token_expires_at')
    .not('ig_access_token', 'is', null)

  if (!accounts?.length) return NextResponse.json({ synced: 0, accounts: 0 })

  const now = new Date()
  const results: Record<string, unknown>[] = []

  for (const account of accounts) {
    // Skip accounts with expired tokens — they need to re-authenticate via OAuth
    if (account.ig_token_expires_at && new Date(account.ig_token_expires_at) < now) {
      console.warn(`[cron/sync-all] Token expired for ${account.username} — skipping`)
      results.push({ username: account.username, skipped: true, reason: 'token_expired' })
      continue
    }

    try {
      const result = await syncAccountReels(account.id)
      results.push({ username: account.username, ...result })
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error desconocido'
      results.push({ username: account.username, error: msg })
    }

    // 500ms delay between accounts to stay within Graph API rate limits
    await new Promise((resolve) => setTimeout(resolve, 500))
  }

  return NextResponse.json({ accounts: accounts.length, results })
}
