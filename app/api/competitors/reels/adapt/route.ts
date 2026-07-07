import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import Anthropic from '@anthropic-ai/sdk'
import { checkRateLimit } from '@/lib/rateLimit'

export const maxDuration = 60

const client = new Anthropic()

export async function POST(req: NextRequest) {
  const accountId = req.cookies.get('ig_account_id')?.value
  if (!accountId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const limit = await checkRateLimit(accountId, 'adapt')
  if (!limit.ok) return NextResponse.json({ error: `Esperá ${limit.retryAfterSeconds}s antes de adaptar otro guión` }, { status: 429 })

  const { reelId, angle } = await req.json()
  if (!reelId) return NextResponse.json({ error: 'Parámetros faltantes' }, { status: 400 })

  const db = createServerSupabase()

  const [{ data: reel }, { data: brand }] = await Promise.all([
    db.from('competitor_reels').select('*, competitors!inner(account_id, ig_username)').eq('id', reelId).eq('competitors.account_id', accountId).single(),
    db.from('brand_dna').select('content, fields').eq('account_id', accountId).single(),
  ])

  if (!reel) return NextResponse.json({ error: 'Reel no encontrado' }, { status: 404 })
  if (!reel.transcript && !reel.caption) {
    return NextResponse.json({ error: 'Este reel no tiene ni transcripción ni caption para adaptar' }, { status: 400 })
  }

  const brandContext = brand?.content || (brand?.fields ? `ADN de marca:\n${JSON.stringify(brand.fields, null, 2)}` : 'No configurado aún')

  // Free tier: adapt from the caption alone (fast, no extra cost). Pro tier:
  // once transcribed, the real spoken content is far richer — worth a
  // stronger model since the user opted into the transcription cost already.
  const usingTranscript = !!reel.transcript
  const model = usingTranscript ? 'claude-sonnet-4-6' : 'claude-haiku-4-5'
  const sourceContent = usingTranscript
    ? `Transcripción completa del video:\n${reel.transcript}`
    : `Solo tenemos el caption (no se transcribió el audio todavía), tomalo como base aproximada:\n"${reel.caption}"`

  const prompt = `Sos un experto en copywriting y contenido viral para Instagram.

# ADN de Marca del creador:
${brandContext}

# Reel de un competidor (@${reel.competitors.ig_username}) que funcionó bien:
${sourceContent}

Métricas: ${reel.views?.toLocaleString() || '—'} views, ${reel.likes?.toLocaleString() || '—'} likes, ${reel.comments?.toLocaleString() || '—'} comentarios.

# Tu tarea:
Adaptá este reel al nicho y estilo del creador${angle ? `, con este ángulo específico: "${angle}"` : ''}.

Generá un guión completo listo para grabar que:
1. Mantenga la MISMA lógica de hook/estructura que hizo funcionar el original
2. Adapte el contenido a su nicho, lenguaje y audiencia
3. Sea auténtico al estilo del creador (no copiar palabras, sí copiar la lógica)
${!usingTranscript ? '4. Como solo tenés el caption, inferí el ángulo del video lo mejor posible — aclaralo brevemente si hace falta asumir algo' : ''}

Formato del guión:
- Empezá con [HOOK] claramente marcado
- Luego [DESARROLLO] con el contenido
- Terminá con [CTA]
- Máximo 250 palabras para un reel de 60-90 segundos

Solo devolvé el guión, sin explicaciones adicionales.`

  try {
    const response = await client.messages.create({
      model,
      max_tokens: 1200,
      messages: [{ role: 'user', content: prompt }],
    })

    const adaptation = (response.content[0] as any).text

    // Independent re-check at write time, scoped by account — not just a
    // reuse of the earlier select's trust, so this stays safe even if that
    // check is ever refactored away.
    const { data: owned } = await db.from('competitors').select('id').eq('id', reel.competitor_id).eq('account_id', accountId).single()
    if (!owned) return NextResponse.json({ error: 'Reel no encontrado' }, { status: 404 })

    await db.from('competitor_reels').update({ adaptation, last_adapted_angle: angle || null }).eq('id', reelId).eq('competitor_id', reel.competitor_id)

    return NextResponse.json({ adaptation, usingTranscript })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
