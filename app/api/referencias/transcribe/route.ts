import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerSupabase } from '@/lib/supabase'
import OpenAI from 'openai'
import { toFile } from 'openai/uploads'
import { checkRateLimit } from '@/lib/rateLimit'

const BUCKET = 'reference-videos'
// Whisper's hard limit is 25MB per file. No server-side audio extraction —
// that required a native ffmpeg binary, which proved unreliable to bundle
// correctly into Vercel's serverless function output. Direct upload is
// simple and reliable; it just means longer/heavier videos need to be
// trimmed or compressed before uploading.
const MAX_WHISPER_BYTES = 25 * 1024 * 1024

export const maxDuration = 120

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const accountId = cookieStore.get('ig_account_id')?.value
  if (!accountId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const limit = await checkRateLimit(accountId, 'transcribe')
  if (!limit.ok) return NextResponse.json({ error: !limit.ok && "message" in limit ? limit.message : `Límite alcanzado. Intentá en ${limit.retryAfterSeconds}s` }, { status: 429 })

  const { refId } = await req.json()
  if (!refId) return NextResponse.json({ error: 'Parámetros faltantes' }, { status: 400 })

  const db = createServerSupabase()

  const { data: ref } = await db
    .from('reference_videos')
    .select('id, file_path, filename')
    .eq('id', refId)
    .eq('account_id', accountId)
    .single()

  if (!ref?.file_path) return NextResponse.json({ error: 'Referencia no encontrada' }, { status: 404 })

  try {
    const { data: fileBlob, error: downloadErr } = await db.storage.from(BUCKET).download(ref.file_path)
    if (downloadErr || !fileBlob) throw new Error(downloadErr?.message || 'No se pudo descargar el video')

    if (fileBlob.size > MAX_WHISPER_BYTES) {
      throw new Error(`El video pesa ${(fileBlob.size / 1024 / 1024).toFixed(0)}MB — el límite para transcribir es 25MB. Subí un video más corto o comprimido.`)
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const transcription = await openai.audio.transcriptions.create({
      file: await toFile(fileBlob, ref.filename || 'video.mp4'),
      model: 'whisper-1',
      language: 'es',
    })

    const transcript = transcription.text.trim()
    const wordCount = transcript.split(/\s+/).filter(Boolean).length

    await db.from('reference_videos').update({
      transcript,
      word_count: wordCount,
      status: 'transcribed',
    }).eq('id', refId).eq('account_id', accountId)

    return NextResponse.json({ transcript, wordCount })
  } catch (e: any) {
    await db.from('reference_videos').update({ status: 'error', error_message: e.message }).eq('id', refId).eq('account_id', accountId)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
