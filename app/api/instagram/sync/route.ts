import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { syncAccountReels } from '@/lib/sync'

export const maxDuration = 300

/**
 * POST /api/instagram/sync
 * Triggers a full reel sync for the current user's Instagram account
 * using the official Graph API.
 */
export async function POST(_req: NextRequest) {
  const cookieStore = await cookies()
  const accountId = cookieStore.get('ig_account_id')?.value
  if (!accountId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  try {
    const result = await syncAccountReels(accountId)
    if (result.error === 'token_expired' || result.error === 'token_missing') {
      return NextResponse.json({ error: result.message, code: result.error }, { status: 401 })
    }
    return NextResponse.json(result)
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Error sincronizando' },
      { status: 500 },
    )
  }
}
