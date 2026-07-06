import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerSupabase } from '@/lib/supabase'

const BUCKET = 'reference-videos'

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const accountId = cookieStore.get('ig_account_id')?.value
  if (!accountId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { refId } = await req.json()
  if (!refId) return NextResponse.json({ error: 'Parámetros faltantes' }, { status: 400 })

  const db = createServerSupabase()

  const { data: ref } = await db
    .from('reference_videos')
    .select('id, file_path')
    .eq('id', refId)
    .eq('account_id', accountId)
    .single()

  if (!ref) return NextResponse.json({ error: 'Referencia no encontrada' }, { status: 404 })

  if (ref.file_path) {
    await db.storage.from(BUCKET).remove([ref.file_path])
  }

  const { error } = await db.from('reference_videos').delete().eq('id', refId).eq('account_id', accountId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
