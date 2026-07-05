import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerSupabase } from '@/lib/supabase'
import { randomUUID } from 'crypto'

const BUCKET = 'reference-videos'

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const accountId = cookieStore.get('ig_account_id')?.value
  if (!accountId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { filename, fileSize } = await req.json()
  if (!filename) return NextResponse.json({ error: 'Falta el nombre del archivo' }, { status: 400 })

  const ext = filename.split('.').pop() || 'mp4'
  const storagePath = `${accountId}/${randomUUID()}.${ext}`

  const db = createServerSupabase()

  // Client uploads the video bytes directly to Supabase Storage via this
  // signed URL — it never passes through this Vercel function, which has a
  // request body size limit far smaller than a typical video file.
  const { data: signed, error: signErr } = await db.storage
    .from(BUCKET)
    .createSignedUploadUrl(storagePath)

  if (signErr) return NextResponse.json({ error: signErr.message }, { status: 500 })

  const { data: ref, error } = await db.from('reference_videos').insert({
    account_id: accountId,
    filename,
    file_path: storagePath,
    file_size: fileSize || null,
    status: 'uploaded',
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    refId: ref.id,
    filePath: storagePath,
    signedUrl: signed.signedUrl,
    token: signed.token,
  })
}
