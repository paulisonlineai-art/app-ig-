import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { syncAccountReels } from '@/lib/sync'
import { checkRateLimit } from '@/lib/rateLimit'

export const maxDuration = 300

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const accountId = cookieStore.get('ig_account_id')?.value
  if (!accountId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const limit = await checkRateLimit(accountId, 'sync')
  if (!limit.ok) return NextResponse.json({ error: !limit.ok && "message" in limit ? limit.message : `Límite alcanzado. Intentá en ${limit.retryAfterSeconds}s` }, { status: 429 })

  try {
    const result = await syncAccountReels(accountId)
    return NextResponse.json(result)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
