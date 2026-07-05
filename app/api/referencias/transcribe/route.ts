import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerSupabase } from '@/lib/supabase'
import { exec } from 'child_process'
import { promisify } from 'util'
import { join, dirname, resolve } from 'path'
import { readFile, unlink } from 'fs/promises'
import { existsSync } from 'fs'

const execAsync = promisify(exec)
const UPLOADS_DIR = resolve('/tmp/moka-uploads')

export const maxDuration = 300

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const accountId = cookieStore.get('ig_account_id')?.value
  if (!accountId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { refId, filePath } = await req.json()
  if (!refId || !filePath) return NextResponse.json({ error: 'Parámetros faltantes' }, { status: 400 })

  // Resolve to the real path and verify it can't escape the uploads dir
  // (e.g. via "../" segments) — a prefix-only check would let a crafted
  // filePath traverse outside it.
  const resolvedPath = resolve(filePath)
  if (resolvedPath !== filePath || (resolvedPath !== UPLOADS_DIR && !resolvedPath.startsWith(UPLOADS_DIR + '/'))) {
    return NextResponse.json({ error: 'Ruta inválida' }, { status: 400 })
  }

  const db = createServerSupabase()

  // Verify this reference video actually belongs to the requesting account
  // before running any (expensive) processing on it.
  const { data: ref } = await db.from('reference_videos').select('id').eq('id', refId).eq('account_id', accountId).single()
  if (!ref) return NextResponse.json({ error: 'Referencia no encontrada' }, { status: 404 })

  const audioPath = filePath.replace(/\.[^.]+$/, '.wav')

  try {
    // Extract audio with ffmpeg
    await execAsync(
      `/opt/homebrew/bin/ffmpeg -y -i "${filePath}" -ar 16000 -ac 1 -vn "${audioPath}"`,
      { timeout: 120000 }
    )

    // Transcribe with Whisper
    const outputDir = dirname(audioPath)
    const { stdout } = await execAsync(
      `python3 -m whisper "${audioPath}" --model medium --language Spanish --output_format txt --output_dir "${outputDir}"`,
      { timeout: 240000 }
    )

    const txtPath = audioPath.replace('.wav', '.txt')
    let transcript = ''
    if (existsSync(txtPath)) {
      transcript = (await readFile(txtPath, 'utf8')).trim()
      await unlink(txtPath).catch(() => {})
    }

    // Clean up audio file
    await unlink(audioPath).catch(() => {})

    // Count words and estimate duration/WPM
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
