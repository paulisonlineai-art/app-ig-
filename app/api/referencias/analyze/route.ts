import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerSupabase } from '@/lib/supabase'
import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 120

const client = new Anthropic()

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const accountId = cookieStore.get('ig_account_id')?.value
  if (!accountId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { refId } = await req.json()
  const db = createServerSupabase()

  const [{ data: ref }, { data: brand }] = await Promise.all([
    db.from('reference_videos').select('*').eq('id', refId).eq('account_id', accountId).single(),
    db.from('brand_dna').select('content, fields').eq('account_id', accountId).single(),
  ])

  if (!ref) return NextResponse.json({ error: 'Referencia no encontrada' }, { status: 404 })
  if (!ref.transcript) return NextResponse.json({ error: 'Sin transcripción disponible' }, { status: 400 })

  const brandContext = brand?.content || (brand?.fields ? JSON.stringify(brand.fields) : 'No configurado')

  const analysisPrompt = `Eres un experto en contenido viral de Instagram y copywriting.

Analizá esta transcripción de un video de referencia de un influencer:

---
${ref.transcript}
---

Devolvé un JSON con esta estructura exacta (sin markdown, solo JSON válido):

{
  "hook": "El gancho exacto con el que empieza el video (primeras 1-2 oraciones)",
  "hook_type": "Pregunta provocadora | Dato sorprendente | Contraintuición | Historia personal | Promesa de valor | Reto/Desafío",
  "tone": "Educativo | Entretenido | Inspiracional | Polémico | Humorístico | Autoritario | Empático",
  "persuasion_technique": "Prueba social | Urgencia | Autoridad | Reciprocidad | Escasez | Historia | Contraste",
  "cta": "El llamado a la acción final",
  "desire_appealed": "Qué deseo o pain point activa este video",
  "ideal_duration": "Duración recomendada para replicar este formato",
  "wpm": 150,
  "key_insights": [
    "Por qué funciona el hook de este video",
    "Técnica específica de retención usada",
    "Ángulo único que lo diferencia"
  ],
  "blocks": [
    { "label": "HOOK", "content": "Qué dice exactamente en la apertura", "duration": "0-5s" },
    { "label": "PROBLEMA", "content": "Cómo plantea el problema o tensión", "duration": "5-15s" },
    { "label": "DESARROLLO", "content": "El contenido de valor principal", "duration": "15-45s" },
    { "label": "CTA", "content": "Cómo cierra y qué pide", "duration": "45-60s" }
  ]
}`

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      messages: [{ role: 'user', content: analysisPrompt }],
    })

    const text = (response.content[0] as any).text
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    const structure = jsonMatch ? JSON.parse(jsonMatch[0]) : {}

    await db.from('reference_videos').update({
      structure,
      hook: structure.hook || null,
      status: 'analyzed',
    }).eq('id', refId).eq('account_id', accountId)

    const { data: updatedRef } = await db.from('reference_videos').select('*').eq('id', refId).eq('account_id', accountId).single()

    return NextResponse.json({ ref: updatedRef })
  } catch (e: any) {
    await db.from('reference_videos').update({ status: 'error', error_message: e.message }).eq('id', refId).eq('account_id', accountId)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
