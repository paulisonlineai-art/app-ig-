import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerSupabase } from '@/lib/supabase'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'

export const maxDuration = 120

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const accountId = cookieStore.get('ig_account_id')?.value
  if (!accountId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  try {
    const formData = await req.formData()
    const file = formData.get('video') as File
    if (!file) return NextResponse.json({ error: 'No se recibió archivo' }, { status: 400 })

    const uploadDir = '/tmp/moka-uploads'
    await mkdir(uploadDir, { recursive: true })

    const ext = file.name.split('.').pop() || 'mp4'
    const filename = `${randomUUID()}.${ext}`
    const filePath = join(uploadDir, filename)

    const bytes = await file.arrayBuffer()
    await writeFile(filePath, Buffer.from(bytes))

    const db = createServerSupabase()
    const { data: ref, error } = await db.from('reference_videos').insert({
      account_id: accountId,
      filename: file.name,
      file_path: filePath,
      file_size: file.size,
      status: 'uploaded',
    }).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ refId: ref.id, filePath })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
