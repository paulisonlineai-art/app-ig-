import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerSupabase } from '@/lib/supabase'
import OpenAI from 'openai'
import { toFile } from 'openai/uploads'
import { exec } from 'child_process'
import { promisify } from 'util'
import { join } from 'path'
import { writeFile, readFile, unlink } from 'fs/promises'
import { randomUUID } from 'crypto'
import ffmpegPath from 'ffmpeg-static'

const execAsync = promisify(exec)

const BUCKET = 'reference-videos'
// Whisper's hard limit is 25MB per file. Video files this size mostly come
// from visual bitrate, not the speech track — extracting just the audio
// (mono, low bitrate, speech doesn't need more) keeps almost any reel-length
// upload well under that cap regardless of the original video's size.
const MAX_WHISPER_BYTES = 25 * 1024 * 1024
const MAX_VIDEO_BYTES = 100 * 1024 * 1024

export const maxDuration = 300

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const accountId = cookieStore.get('ig_account_id')?.value
  if (!accountId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

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

  // Unique per-request temp paths — /tmp on Vercel is only guaranteed to
  // live for the duration of a single invocation, which is exactly the
  // scope these files need (download → extract → transcribe → cleanup, all
  // in this one request).
  const workId = randomUUID()
  const videoPath = join('/tmp', `${workId}-video`)
  const audioPath = join('/tmp', `${workId}-audio.mp3`)

  try {
    const { data: fileBlob, error: downloadErr } = await db.storage.from(BUCKET).download(ref.file_path)
    if (downloadErr || !fileBlob) throw new Error(downloadErr?.message || 'No se pudo descargar el video')

    if (fileBlob.size > MAX_VIDEO_BYTES) {
      throw new Error(`El video pesa ${(fileBlob.size / 1024 / 1024).toFixed(0)}MB — el máximo es 150MB.`)
    }

    await writeFile(videoPath, Buffer.from(await fileBlob.arrayBuffer()))

    // Extract mono, low-bitrate audio — plenty for speech transcription,
    // and small enough to clear Whisper's 25MB cap for any reel-length video.
    await execAsync(
      `"${ffmpegPath}" -y -i "${videoPath}" -vn -ac 1 -ar 16000 -b:a 64k "${audioPath}"`,
      { timeout: 240000 }
    )

    const audioBuffer = await readFile(audioPath)
    if (audioBuffer.length > MAX_WHISPER_BYTES) {
      throw new Error('El audio extraído sigue superando 25MB — el video es demasiado largo para transcribir.')
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const transcription = await openai.audio.transcriptions.create({
      file: await toFile(audioBuffer, 'audio.mp3'),
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
  } finally {
    await unlink(videoPath).catch(() => {})
    await unlink(audioPath).catch(() => {})
  }
}
