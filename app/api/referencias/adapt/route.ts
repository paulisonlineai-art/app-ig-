import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerSupabase } from '@/lib/supabase'
import Anthropic from '@anthropic-ai/sdk'
import { checkRateLimit } from '@/lib/rateLimit'

export const maxDuration = 120

const client = new Anthropic()

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const accountId = cookieStore.get('ig_account_id')?.value
  if (!accountId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const limit = await checkRateLimit(accountId, 'adapt')
  if (!limit.ok) return NextResponse.json({ error: !limit.ok && "message" in limit ? limit.message : `Límite alcanzado. Intentá en ${limit.retryAfterSeconds}s` }, { status: 429 })

  const { refId, angle } = await req.json()
  const db = createServerSupabase()

  const [{ data: ref }, { data: brand }] = await Promise.all([
    db.from('reference_videos').select('*').eq('id', refId).eq('account_id', accountId).single(),
    db.from('brand_dna').select('content, fields').eq('account_id', accountId).single(),
  ])

  if (!ref) return NextResponse.json({ error: 'Referencia no encontrada' }, { status: 404 })
  if (!ref.transcript) return NextResponse.json({ error: 'Sin transcripción' }, { status: 400 })

  const brandContext = brand?.content || (brand?.fields ? `ADN de marca:\n${JSON.stringify(brand.fields, null, 2)}` : 'No configurado aún')
  const structure = ref.structure ? (typeof ref.structure === 'string' ? JSON.parse(ref.structure) : ref.structure) : null

  const prompt = `Sos un experto en copywriting y contenido viral para Instagram.

# ADN de Marca del creador:
${brandContext}

# Video de referencia analizado:
Transcripción:
${ref.transcript}

${structure ? `Estructura detectada:
- Hook: ${structure.hook}
- Tipo de hook: ${structure.hook_type}
- Tono: ${structure.tone}
- Técnica de persuasión: ${structure.persuasion_technique}
- CTA original: ${structure.cta}` : ''}

# Tu tarea:
Adaptá este video al nicho y estilo del creador${angle ? `, con este ángulo específico: "${angle}"` : ''}.

Generá un guión completo listo para grabar que:
1. Mantenga la MISMA estructura de bloques que funcionó en el original
2. Use el MISMO tipo de hook pero con el tema del creador
3. Adapte el contenido a su nicho, lenguaje y audiencia
4. Mantenga el tono y técnica de persuasión que hizo viral el original
5. Sea auténtico al estilo del creador (no copiar palabras, sí copiar la lógica)

Formato del guión:
- Empezá con [HOOK] claramente marcado
- Luego [DESARROLLO] con el contenido
- Terminá con [CTA]
- Incluí indicaciones de tono entre paréntesis donde sea útil
- Máximo 250 palabras para un reel de 60-90 segundos

Solo devolvé el guión, sin explicaciones adicionales.`

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1200,
      messages: [{ role: 'user', content: prompt }],
    })

    const adaptation = (response.content[0] as any).text

    await db.from('reference_videos').update({ adaptation, last_adapted_angle: angle || null }).eq('id', refId).eq('account_id', accountId)

    return NextResponse.json({ adaptation })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
