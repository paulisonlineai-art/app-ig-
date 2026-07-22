import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { checkRateLimit } from '@/lib/rateLimit'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const accountId = req.cookies.get('ig_account_id')?.value
  if (!accountId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const limit = await checkRateLimit(accountId, 'hook_lab')
  if (!limit.ok) return NextResponse.json({ error: !limit.ok && "message" in limit ? limit.message : `Límite alcanzado. Intentá en ${limit.retryAfterSeconds}s` }, { status: 429 })

  const { action, hookIndex, topic } = await req.json()

  const db = createServerSupabase()
  const { data: reels } = await db
    .from('reels')
    .select('hook,views,multiplier,like_rate,comment_rate,save_rate,share_rate,caption,structure,duration_seconds')
    .eq('account_id', accountId)
    .not('hook', 'is', null)
    .order('timestamp', { ascending: false })
    .limit(100)

  if (!reels?.length) return NextResponse.json({ error: 'No hay hooks analizados' }, { status: 400 })

  if (action === 'analyze') {
    const hookData = reels.map(r => ({
      hook: r.hook,
      multiplier: r.multiplier,
      views: r.views,
      save_rate: r.save_rate,
      comment_rate: r.comment_rate,
      type: r.structure?.narrative_type || null,
    }))

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      messages: [{
        role: 'user',
        content: `Analizá los hooks de esta cuenta de Instagram y devolvé SOLO un JSON válido.

HOOKS CON MÉTRICAS:
${JSON.stringify(hookData, null, 2)}

Devolvé este JSON exacto:
{
  "hook_types": [
    {"type": "nombre del tipo", "count": N, "avg_multiplier": N, "best_hook": "el mejor hook de este tipo", "verdict": "funciona bien/mal y por qué"},
  ],
  "top_hooks": [
    {"hook": "texto del hook", "multiplier": N, "why": "por qué funcionó"}
  ],
  "worst_hooks": [
    {"hook": "texto", "multiplier": N, "why": "por qué falló"}
  ],
  "golden_rules": ["regla 1 basada en datos", "regla 2", "regla 3"],
  "summary": "resumen de 1 línea del patrón ganador"
}

Tipos de hook a clasificar: pregunta, dato_impactante, historia, provocación, promesa, tutorial, lista, confesión, contrario.
Devolvé SOLO el JSON.`,
      }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : '{}'
    const match = text.match(/\{[\s\S]*\}/)
    try {
      return NextResponse.json({ analysis: JSON.parse(match ? match[0] : text) })
    } catch {
      return NextResponse.json({ error: 'Error parseando análisis' }, { status: 500 })
    }
  }

  if (action === 'generate') {
    const top = [...reels].sort((a, b) => b.multiplier - a.multiplier).slice(0, 5)
    const sourceHook = hookIndex !== undefined && top[hookIndex] ? top[hookIndex].hook : top[0]?.hook

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `Generá 10 variaciones de un hook ganador adaptadas a un tema nuevo.

HOOK GANADOR ORIGINAL: "${sourceHook}"
(Este hook tuvo ${top[hookIndex || 0]?.multiplier?.toFixed(1)}x el promedio de views)

OTROS HOOKS QUE FUNCIONARON:
${top.map(r => `- "${r.hook}" (${r.multiplier.toFixed(1)}x)`).join('\n')}

TEMA NUEVO: ${topic || 'el mismo nicho de la cuenta'}

Generá 10 variaciones que mantengan la ESTRUCTURA y ENERGÍA del hook original pero adaptadas al tema nuevo. Para cada una incluí:
1. El hook exacto
2. Por qué mantiene el patrón ganador

Sé específico. No hagas hooks genéricos.`,
      }],
    })

    const result = message.content[0].type === 'text' ? message.content[0].text : ''
    return NextResponse.json({ variations: result })
  }

  return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
}
