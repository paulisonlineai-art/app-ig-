import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { checkRateLimit } from '@/lib/rateLimit'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const accountId = req.cookies.get('ig_account_id')?.value
  if (!accountId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const limit = await checkRateLimit(accountId, 'predict_virality')
  if (!limit.ok) return NextResponse.json({ error: !limit.ok && "message" in limit ? limit.message : `Límite alcanzado. Intentá en ${limit.retryAfterSeconds}s` }, { status: 429 })

  const { hook, caption, duration, format } = await req.json()
  if (!hook?.trim()) return NextResponse.json({ error: 'Hook requerido' }, { status: 400 })

  const db = createServerSupabase()
  const { data: reels } = await db
    .from('reels')
    .select('caption,views,multiplier,like_rate,comment_rate,save_rate,share_rate,hook,duration_seconds,structure')
    .eq('account_id', accountId)
    .order('timestamp', { ascending: false })
    .limit(50)

  if (!reels?.length) return NextResponse.json({ error: 'Necesitás al menos algunos reels sincronizados' }, { status: 400 })

  const top = [...reels].sort((a, b) => b.multiplier - a.multiplier).slice(0, 10)
  const bottom = [...reels].sort((a, b) => a.multiplier - b.multiplier).slice(0, 10)
  const avgMultiplier = reels.reduce((s, r) => s + r.multiplier, 0) / reels.length

  const topSummary = top.map(r =>
    `- Hook: "${r.hook}" | ${r.multiplier.toFixed(1)}x | ${r.views} views | save: ${r.save_rate}% | dur: ${r.duration_seconds}s | tipo: ${r.structure?.narrative_type || '?'}`
  ).join('\n')

  const bottomSummary = bottom.map(r =>
    `- Hook: "${r.hook}" | ${r.multiplier.toFixed(1)}x | ${r.views} views | dur: ${r.duration_seconds}s`
  ).join('\n')

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `Sos un algoritmo de predicción de viralidad para Instagram. Basándote en los datos REALES de esta cuenta, predecí qué tan bien va a funcionar un reel nuevo.

**PATRONES GANADORES DE ESTA CUENTA (top 10 reels):**
${topSummary}

**PATRONES PERDEDORES (bottom 10 reels):**
${bottomSummary}

**PROMEDIOS:** multiplier promedio: ${avgMultiplier.toFixed(2)}x

**REEL NUEVO A EVALUAR:**
- Hook: "${hook}"
${caption ? `- Caption/tema: "${caption}"` : ''}
${duration ? `- Duración estimada: ${duration}s` : ''}
${format ? `- Formato: ${format}` : ''}

Respondé SOLO con un JSON válido, sin texto adicional:
{
  "score": <número del 0 al 100>,
  "predicted_multiplier": <número estimado como "1.5x">,
  "confidence": "<alta|media|baja>",
  "strengths": ["fortaleza 1", "fortaleza 2"],
  "risks": ["riesgo 1", "riesgo 2"],
  "similar_to": "<el reel exitoso más parecido de tu historial>",
  "suggestions": ["mejora concreta 1", "mejora concreta 2", "mejora concreta 3"],
  "verdict": "<una frase de 1 línea con el veredicto final>"
}`,
    }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : '{}'
  const match = text.match(/\{[\s\S]*\}/)
  try {
    const prediction = JSON.parse(match ? match[0] : text)
    return NextResponse.json({ prediction })
  } catch {
    return NextResponse.json({ prediction: { score: 50, verdict: text, strengths: [], risks: [], suggestions: [] } })
  }
}
