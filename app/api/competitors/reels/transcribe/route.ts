import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import OpenAI from 'openai'
import { toFile } from 'openai/uploads'
import { checkRateLimit } from '@/lib/rateLimit'

// Same 25MB Whisper cap as Referencias — no server-side audio extraction
// here either, for the same reliability reasons (see referencias/transcribe).
const MAX_WHISPER_BYTES = 25 * 1024 * 1024

export const maxDuration = 120

export async function POST(req: NextRequest) {
  const accountId = req.cookies.get('ig_account_id')?.value
  if (!accountId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const limit = await checkRateLimit(accountId, 'transcribe')
  if (!limit.ok) return NextResponse.json({ error: !limit.ok && "message" in limit ? limit.message : `Límite alcanzado. Intentá en ${limit.retryAfterSeconds}s` }, { status: 429 })

  const { reelId } = await req.json()
  if (!reelId) return NextResponse.json({ error: 'Parámetros faltantes' }, { status: 400 })

  const db = createServerSupabase()

  const { data: reel } = await db
    .from('competitor_reels')
    .select('id, competitor_id, video_url, competitors!inner(account_id)')
    .eq('id', reelId)
    .eq('competitors.account_id', accountId)
    .single()

  if (!reel) return NextResponse.json({ error: 'Reel no encontrado' }, { status: 404 })
  if (!reel.video_url) return NextResponse.json({ error: 'Este reel no tiene video descargable' }, { status: 400 })

  // Independent re-check at write time, scoped by account — not just a
  // reuse of the earlier select's trust, so this stays safe even if that
  // check is ever refactored away.
  const { data: owned } = await db.from('competitors').select('id').eq('id', reel.competitor_id).eq('account_id', accountId).single()
  if (!owned) return NextResponse.json({ error: 'Reel no encontrado' }, { status: 404 })

  try {
    const videoRes = await fetch(reel.video_url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.instagram.com/',
      },
    })
    if (!videoRes.ok) throw new Error('No se pudo descargar el video del competidor')

    const contentLength = Number(videoRes.headers.get('content-length') || 0)
    if (contentLength > MAX_WHISPER_BYTES) {
      throw new Error(`El video pesa ${(contentLength / 1024 / 1024).toFixed(0)}MB — el límite para transcribir es 25MB.`)
    }

    const buffer = Buffer.from(await videoRes.arrayBuffer())
    if (buffer.length > MAX_WHISPER_BYTES) {
      throw new Error(`El video pesa ${(buffer.length / 1024 / 1024).toFixed(0)}MB — el límite para transcribir es 25MB.`)
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const transcription = await openai.audio.transcriptions.create({
      file: await toFile(buffer, 'video.mp4'),
      model: 'whisper-1',
      language: 'es',
    })

    const transcript = transcription.text.trim()
    const wordCount = transcript.split(/\s+/).filter(Boolean).length

    await db.from('competitor_reels').update({
      transcript,
      word_count: wordCount,
      transcribe_status: 'transcribed',
    }).eq('id', reelId).eq('competitor_id', reel.competitor_id)

    return NextResponse.json({ transcript, wordCount })
  } catch (e: any) {
    await db.from('competitor_reels').update({ transcribe_status: 'error', error_message: e.message }).eq('id', reelId).eq('competitor_id', reel.competitor_id)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
