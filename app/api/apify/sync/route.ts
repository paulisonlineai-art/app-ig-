import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { syncAccountReels } from '@/lib/sync'

export const maxDuration = 300

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const accountId = cookieStore.get('ig_account_id')?.value
  if (!accountId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  try {
    const result = await syncAccountReels(accountId)
    return NextResponse.json(result)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
