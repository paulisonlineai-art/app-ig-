import Anthropic from '@anthropic-ai/sdk'
import type { Reel, ReelStructure } from '@/types'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function analyzeReel(reel: Reel, accountAverages: {
  avg_views: number
  avg_like_rate: number
  avg_save_rate: number
  avg_comment_rate: number
  avg_share_rate: number
  avg_wpm: number
}): Promise<string> {
  const prompt = `Eres Moka, un experto en análisis de contenido de Instagram especializado en creadores de contenido hispanohablantes que venden servicios digitales.

Analizá este Reel con todos los datos disponibles:

**MÉTRICAS DEL REEL:**
- Views: ${reel.views.toLocaleString()}
- Likes: ${reel.likes.toLocaleString()} (${reel.like_rate.toFixed(2)}% tasa)
- Comentarios: ${reel.comments.toLocaleString()} (${reel.comment_rate.toFixed(2)}% tasa)
- Multiplicador vs promedio: ${reel.multiplier.toFixed(2)}x
${reel.words_per_minute ? `- Palabras por minuto: ${reel.words_per_minute}` : ''}

**PROMEDIOS DE LA CUENTA:**
- Views promedio: ${accountAverages.avg_views.toLocaleString()}
- Tasa like promedio: ${accountAverages.avg_like_rate.toFixed(2)}%
- Tasa comentarios promedio: ${accountAverages.avg_comment_rate.toFixed(2)}%
- WPM óptimo: ${accountAverages.avg_wpm}

**TRANSCRIPCIÓN:**
${reel.transcript || 'No disponible'}

**ESTRUCTURA DETECTADA:**
- Hook: ${reel.hook || 'No detectado'}
- CTA: ${reel.cta || 'No detectado'}
- Estructura: ${JSON.stringify(reel.structure, null, 2)}

Analizá:
1. Por qué este reel funcionó o no funcionó (comparando con el promedio)
2. Qué métrica específica fue la que más destacó y qué dice eso sobre la audiencia
3. Qué tipo de contenido es (guardable, comentable, viral, etc.)
4. Qué le funcionó en el hook y por qué retiene
5. Recomendaciones concretas para replicar lo que funcionó o mejorar lo que no

Sé específico, data-driven y accionable. Máximo 400 palabras.`

  const message = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })

  return message.content[0].type === 'text' ? message.content[0].text : ''
}

export async function transcribeAndStructure(transcript: string): Promise<{
  hook: string
  structure: ReelStructure
  words_per_minute: number
  duration_estimate: number
}> {
  const wordCount = transcript.split(' ').length

  const message = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `Analizá esta transcripción de un Reel de Instagram y devolvé un JSON con esta estructura exacta:

{
  "hook": "los primeros 1-2 segundos que enganchan",
  "structure": {
    "hook": "el gancho inicial",
    "promise": "la promesa que hace el video",
    "development": "el desarrollo del contenido",
    "cta": "el llamado a la acción final",
    "narrative_type": "tutorial|historia|lista|prediccion|critica|filosofico|caso_de_estudio",
    "desire_appealed": "el deseo egoísta de la audiencia al que apela",
    "cta_type": "comentar|guardar|seguir|escribir|comprar|visitar|otro"
  },
  "words_per_minute": ${wordCount},
  "duration_estimate": 0
}

Transcripción:
${transcript}

Devolvé SOLO el JSON, sin texto adicional.`
    }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : '{}'
  try {
    return JSON.parse(text)
  } catch {
    return {
      hook: '',
      structure: {
        hook: '',
        promise: '',
        development: '',
        cta: '',
        narrative_type: '',
        desire_appealed: '',
        cta_type: '',
      },
      words_per_minute: wordCount,
      duration_estimate: 0,
    }
  }
}

export async function generateContentIdeas(params: {
  myTopReels: Reel[]
  competitorInsights: string
  accountDNA: string
  objective: string
}): Promise<string> {
  const topReelsSummary = params.myTopReels.slice(0, 5).map(r =>
    `- "${r.caption?.slice(0, 80)}..." | ${r.multiplier.toFixed(1)}x promedio | Like rate: ${r.like_rate.toFixed(2)}% | Hook: ${r.hook}`
  ).join('\n')

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    messages: [{
      role: 'user',
      content: `Eres Moka, experto en contenido de Instagram para venta de servicios digitales.

**ADN DE MARCA:**
${params.accountDNA}

**MIS REELS QUE MÁS FUNCIONARON:**
${topReelsSummary}

**INSIGHTS DE COMPETIDORES:**
${params.competitorInsights}

**OBJETIVO:**
${params.objective}

Generá 5 ideas de contenido ganadoras para Reels. Para cada una incluí:
- Concepto central
- Hook específico (primeras palabras exactas)
- Por qué va a funcionar (basado en los patrones identificados)
- Tipo de CTA recomendado
- Qué métrica va a destacar (guardados, comentarios, shares)

Basate en los patrones reales de lo que ya funcionó, no inventes cosas genéricas.`
    }],
  })

  return message.content[0].type === 'text' ? message.content[0].text : ''
}

export async function chatWithMoka(params: {
  question: string
  reels: Reel[]
  accountStats: object
  competitorData?: object
  accountDNA?: string
}): Promise<string> {
  const reelsSummary = params.reels.slice(0, 20).map(r => ({
    caption: r.caption?.slice(0, 60),
    views: r.views,
    multiplier: r.multiplier,
    like_rate: r.like_rate,
    comment_rate: r.comment_rate,
    hook: r.hook,
    timestamp: r.timestamp,
    sales: 0,
  }))

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    messages: [{
      role: 'user',
      content: `Eres Moka, el sistema de IA para análisis de contenido de Instagram. Tenés acceso a todos los datos de la cuenta.

**STATS GENERALES:**
${JSON.stringify(params.accountStats, null, 2)}

**REELS (últimos 20):**
${JSON.stringify(reelsSummary, null, 2)}

${params.competitorData ? `**DATOS DE COMPETIDORES:**\n${JSON.stringify(params.competitorData, null, 2)}` : ''}

${params.accountDNA ? `**ADN DE MARCA:**\n${params.accountDNA}` : ''}

**PREGUNTA:**
${params.question}

Respondé de forma específica, data-driven, con ejemplos concretos de los datos disponibles. Sé directo y accionable.`
    }],
  })

  return message.content[0].type === 'text' ? message.content[0].text : ''
}
