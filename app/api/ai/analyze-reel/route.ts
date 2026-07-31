import { NextRequest, NextResponse } from 'next/server'
import { analyzeReel, transcribeAndStructure } from '@/lib/ai'
import { createServerSupabase } from '@/lib/supabase'
import { calcAverages } from '@/lib/utils'
import OpenAI from 'openai'
import { toFile } from 'openai/uploads'

export const maxDuration = 120

async function transcribeVideo(videoUrl: string): Promise<string | null> {
  if (!videoUrl || !process.env.OPENAI_API_KEY) return null

  try {
    const res = await fetch(videoUrl, {
      signal: AbortSignal.timeout(30000),
      headers: { 'User-Agent': 'Mozilla/5.0' },
    })
    if (!res.ok) return null

    const blob = await res.blob()
    if (blob.size > 25 * 1024 * 1024) return null

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const transcription = await openai.audio.transcriptions.create({
      file: await toFile(blob, 'reel.mp4'),
      model: 'whisper-1',
      language: 'es',
    })

    return transcription.text?.trim() || null
  } catch (e) {
    console.error('[analyze-reel] transcription failed:', e)
    return null
  }
}

export async function POST(req: NextRequest) {
  const accountId = req.cookies.get('ig_account_id')?.value
  if (!accountId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { reelId } = await req.json()

  const db = createServerSupabase()
  const [{ data: reel }, { data: allReels }] = await Promise.all([
    db.from('reels').select('*').eq('id', reelId).eq('account_id', accountId).single(),
    db.from('reels').select('views,like_rate,comment_rate,words_per_minute').eq('account_id', accountId),
  ])

  if (!reel) return NextResponse.json({ error: 'Reel not found' }, { status: 404 })

  // Transcribe if not already done
  if (!reel.transcript && reel.permalink) {
    // Get video URL from Apify for this specific reel
    const videoUrl = await getVideoUrl(reel.permalink)
    if (videoUrl) {
      const transcript = await transcribeVideo(videoUrl)
      if (transcript) {
        const structured = await transcribeAndStructure(transcript)
        const updateFields: Record<string, any> = {
          transcript,
          hook: structured.hook,
          structure: structured.structure,
          words_per_minute: structured.words_per_minute || null,
          cta: structured.structure?.cta || null,
        }
        await db.from('reels').update(updateFields).eq('id', reelId).eq('account_id', accountId)
        Object.assign(reel, updateFields)
      }
    }
  }

  const averages = calcAverages(allReels || [])
  const analysis = await analyzeReel(reel, averages)

  await db.from('reels').update({ ai_analysis: analysis }).eq('id', reelId).eq('account_id', accountId)

  return NextResponse.json({ analysis })
}

async function getVideoUrl(permalink: string): Promise<string | null> {
  const shortCode = permalink.match(/\/reel\/([^/?]+)/)?.[1] || permalink.match(/\/p\/([^/?]+)/)?.[1]
  if (!shortCode) return null

  const token = process.env.APIFY_API_TOKEN
  if (!token) return null

  try {
    const res = await fetch(
      `https://api.apify.com/v2/acts/apify~instagram-scraper/run-sync-get-dataset-items?token=${token}&timeout=60`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          directUrls: [`https://www.instagram.com/reel/${shortCode}/`],
          resultsType: 'posts',
          resultsLimit: 1,
        }),
        signal: AbortSignal.timeout(70000),
      },
    )
    if (!res.ok) return null
    const items = await res.json()
    return items?.[0]?.videoUrl || null
  } catch {
    return null
  }
}
