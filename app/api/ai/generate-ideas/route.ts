import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import Anthropic from '@anthropic-ai/sdk'
import { checkRateLimit } from '@/lib/rateLimit'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const accountId = req.cookies.get('ig_account_id')?.value
  if (!accountId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const limit = await checkRateLimit(accountId, 'generate_ideas')
  if (!limit.ok) return NextResponse.json({ error: !limit.ok && "message" in limit ? limit.message : `Límite alcanzado. Intentá en ${limit.retryAfterSeconds}s` }, { status: 429 })

  const { prompt } = await req.json()

  const db = createServerSupabase()
  const [{ data: reels }, { data: brand }, { data: competitors }] = await Promise.all([
    db.from('reels').select('caption,views,multiplier,like_rate,comment_rate,hook,timestamp').eq('account_id', accountId).order('multiplier', { ascending: false }).limit(15),
    db.from('brand_dna').select('content').eq('account_id', accountId).single(),
    db.from('competitors').select('ig_username, competitor_reels(caption,views,likes,hook)').eq('account_id', accountId).limit(5),
  ])

  const reelsSummary = (reels || []).map(r => ({
    caption: r.caption?.slice(0, 60),
    views: r.views,
    multiplier: r.multiplier,
    like_rate: r.like_rate,
    hook: r.hook,
    date: new Date(r.timestamp).toLocaleDateString('es'),
  }))

  const competitorSummary = (competitors || []).map((c: any) => ({
    username: c.ig_username,
    topReels: (c.competitor_reels || []).slice(0, 3).map((r: any) => ({
      caption: r.caption?.slice(0, 60),
      views: r.views,
      hook: r.hook,
    })),
  }))

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: `Sos Klar, el sistema de IA para análisis de contenido de Instagram. Tenés acceso a datos reales de la cuenta.

**MIS REELS (ordenados por multiplicador):**
${JSON.stringify(reelsSummary, null, 2)}

${competitorSummary.length > 0 ? `**DATOS DE COMPETIDORES:**\n${JSON.stringify(competitorSummary, null, 2)}` : ''}

${brand?.content ? `**ADN DE MARCA:**\n${brand.content}` : ''}

**PREGUNTA/SOLICITUD:**
${prompt}

Respondé de forma específica, data-driven. Cuando propongas ideas de contenido, incluí siempre:
- El hook exacto (primeras palabras)
- Por qué va a funcionar (basado en los datos reales)
- Qué métrica va a destacar
- CTA recomendado

Sé directo y accionable. No uses frases genéricas.`,
      }],
    })

    const result = message.content[0].type === 'text' ? message.content[0].text : ''
    return NextResponse.json({ result })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Error generando ideas' }, { status: 500 })
  }
}
