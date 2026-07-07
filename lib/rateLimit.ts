import { createServerSupabase } from '@/lib/supabase'

// Minimum seconds between calls to the same expensive action, per account.
// These are the buttons that cost real money per click (Apify/Anthropic/
// OpenAI) and had no cooldown at all — a double-click or a script could
// hammer them with zero limit, which is most of why the Apify plan already
// hit its monthly usage cap.
const MIN_INTERVAL_SECONDS: Record<string, number> = {
  sync: 60,
  refresh_profile: 60,
  competitor_sync: 60,
  brand_auto_generate: 30,
  transcribe: 20,
  // Trying several angles on the same reel/reference back-to-back is the
  // intended workflow (both adapt UIs offer 5 preset angle buttons) — this
  // just needs to block accidental double-clicks, not sequential exploring.
  adapt: 3,
  chat: 5,
  generate_ideas: 15,
}

export async function checkRateLimit(accountId: string, action: string): Promise<{ ok: true } | { ok: false; retryAfterSeconds: number }> {
  const db = createServerSupabase()
  const minInterval = MIN_INTERVAL_SECONDS[action] ?? 10

  const { data } = await db.from('rate_limits').select('last_called_at').eq('account_id', accountId).eq('action', action).maybeSingle()
  const now = Date.now()

  if (data?.last_called_at) {
    const elapsed = (now - new Date(data.last_called_at).getTime()) / 1000
    if (elapsed < minInterval) {
      return { ok: false, retryAfterSeconds: Math.ceil(minInterval - elapsed) }
    }
  }

  await db.from('rate_limits').upsert(
    { account_id: accountId, action, last_called_at: new Date(now).toISOString() },
    { onConflict: 'account_id,action' }
  )
  return { ok: true }
}
