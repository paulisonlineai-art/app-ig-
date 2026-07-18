import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { scrapeReelComments } from '@/lib/apify'
import { checkRateLimit } from '@/lib/rateLimit'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const accountId = req.cookies.get('ig_account_id')?.value
  if (!accountId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const limit = await checkRateLimit(accountId, 'chat')
  if (!limit.ok) return NextResponse.json({ error: `Esperá ${limit.retryAfterSeconds}s` }, { status: 429 })

  const db = createServerSupabase()

  let body: { permalinks?: string[] } = {}
  try { body = await req.json() } catch {}

  let topReels: any[]
  let reelUrls: string[]

  if (body.permalinks?.length) {
    reelUrls = body.permalinks
    const { data } = await db
      .from('reels')
      .select('caption, views, comments, multiplier, permalink, hook')
      .eq('account_id', accountId)
      .in('permalink', reelUrls)
    topReels = data || []
  } else {
    const { data } = await db
      .from('reels')
      .select('caption, views, comments, multiplier, permalink, hook')
      .eq('account_id', accountId)
      .order('comments', { ascending: false })
      .limit(5)
    topReels = data || []
    reelUrls = topReels.map(r => r.permalink).filter((url): url is string => !!url)
  }

  if (!topReels.length) {
    return NextResponse.json({ error: 'No hay reels con comentarios para analizar' }, { status: 400 })
  }

  if (!reelUrls.length) {
    return NextResponse.json({ error: 'No se encontraron URLs de reels' }, { status: 400 })
  }

  try {
    const comments = await scrapeReelComments(reelUrls, 80)

    if (!comments.length) {
      return NextResponse.json({ error: 'No se pudieron obtener comentarios. Intentá de nuevo.' }, { status: 400 })
    }

    const reelContext = topReels.map(r =>
      `- "${r.caption?.slice(0, 80) || '(sin caption)'}" — ${r.views?.toLocaleString()} views, ${r.comments} comentarios, ${r.multiplier?.toFixed(1)}x`
    ).join('\n')

    const commentsByReel: Record<string, string[]> = {}
    for (const c of comments) {
      const key = c.reelUrl || 'unknown'
      if (!commentsByReel[key]) commentsByReel[key] = []
      commentsByReel[key].push(c.text)
    }

    const commentsText = Object.entries(commentsByReel).map(([url, texts]) => {
      const reel = topReels.find(r => r.permalink === url)
      const header = reel ? `Reel: "${reel.caption?.slice(0, 60) || url}"` : `Reel: ${url}`
      return `${header}\nComentarios:\n${texts.map(t => `  - "${t}"`).join('\n')}`
    }).join('\n\n')

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: `Sos Klar, experto en estrategia de contenido para Instagram. Analizá los comentarios REALES de la audiencia de esta cuenta y extraé ideas de contenido.

**REELS MÁS COMENTADOS:**
${reelContext}

**COMENTARIOS REALES DE LA AUDIENCIA:**
${commentsText}

Analizá los comentarios y respondé con estas secciones:

**TEMAS QUE TU AUDIENCIA PIDE**
¿Qué preguntas, dudas o temas aparecen repetidamente? Agrupá por tema.

**OBJECIONES Y MIEDOS DETECTADOS**
¿Qué objeciones o miedos expresa tu audiencia? (son oro para contenido de venta)

**5 IDEAS DE CONTENIDO SACADAS DE TUS COMENTARIOS**
Para cada idea:
- El comentario real que la inspiró
- Hook exacto para el reel
- Por qué va a funcionar (conecta con una necesidad real expresada)

**PATRÓN DE ENGAGEMENT**
¿Qué tipo de contenido genera más conversación? ¿Qué tienen en común los reels con más comentarios?

Sé específico y basate solo en los comentarios reales. No inventes — usá las palabras exactas de la audiencia como inspiración.`,
      }],
    })

    const result = message.content[0].type === 'text' ? message.content[0].text : ''
    return NextResponse.json({ result, commentCount: comments.length, reelCount: reelUrls.length })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Error analizando comentarios' }, { status: 500 })
  }
}
