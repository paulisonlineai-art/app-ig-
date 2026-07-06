import { SupabaseClient } from '@supabase/supabase-js'

function randomCode(): string {
  return Math.random().toString(36).slice(2, 10)
}

// Short, URL-safe code identifying a reel in checkout links (Stripe
// client_reference_id, Hotmart sck) — generated lazily so old reels don't
// all need one, and short so it fits platform tracking-param constraints.
export async function getOrCreateTrackingCode(db: SupabaseClient, reelId: string): Promise<string> {
  const { data: reel } = await db.from('reels').select('tracking_code').eq('id', reelId).single()
  if (reel?.tracking_code) return reel.tracking_code

  for (let i = 0; i < 5; i++) {
    const code = randomCode()
    const { error } = await db.from('reels').update({ tracking_code: code }).eq('id', reelId)
    if (!error) return code
  }
  throw new Error('No se pudo generar un código de tracking')
}
