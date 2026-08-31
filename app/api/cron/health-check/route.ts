import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'

export const maxDuration = 30

export async function GET() {
  const checks: Record<string, { ok: boolean; detail?: string }> = {}

  // 1. Supabase connection
  try {
    const db = createServerSupabase()
    const { count, error } = await db.from('ig_accounts').select('id', { count: 'exact', head: true })
    if (error) throw new Error(error.message)
    checks.supabase = { ok: true, detail: `${count} accounts` }
  } catch (e: any) {
    checks.supabase = { ok: false, detail: e.message }
  }

  // 2. Apify token
  try {
    const res = await fetch('https://api.apify.com/v2/users/me?token=' + (process.env.APIFY_API_TOKEN || ''), {
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) throw new Error(`${res.status}`)
    const data = await res.json()
    checks.apify = { ok: true, detail: `user: ${data.data?.username || '?'}` }
  } catch (e: any) {
    checks.apify = { ok: false, detail: e.message }
  }

  // 3. Anthropic API
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 5,
        messages: [{ role: 'user', content: 'ping' }],
      }),
      signal: AbortSignal.timeout(10000),
    })
    checks.anthropic = { ok: res.ok, detail: res.ok ? 'connected' : `${res.status}` }
  } catch (e: any) {
    checks.anthropic = { ok: false, detail: e.message }
  }

  // 4. OpenAI (Whisper)
  checks.openai = { ok: !!process.env.OPENAI_API_KEY, detail: process.env.OPENAI_API_KEY ? 'key present' : 'missing key' }

  const allOk = Object.values(checks).every(c => c.ok)

  return NextResponse.json({
    status: allOk ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    checks,
  }, { status: allOk ? 200 : 503 })
}
