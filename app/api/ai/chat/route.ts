import { NextRequest, NextResponse } from 'next/server'
import { chatWithKlar } from '@/lib/ai'
import { createServerSupabase } from '@/lib/supabase'
import { checkRateLimit } from '@/lib/rateLimit'
import { scrapeReelComments } from '@/lib/scraper'

const COMMENT_KEYWORDS = ['comentario', 'comments', 'audiencia dice', 'audiencia pide', 'ideas de contenido de', 'sacá ideas', 'saca ideas', 'comentan', 'preguntan']

function isCommentQuery(q: string): boolean {
  const lower = q.toLowerCase()
  return COMMENT_KEYWORDS.some(k => lower.includes(k))
}

export async function POST(req: NextRequest) {
  const accountId = req.cookies.get('ig_account_id')?.value
  if (!accountId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const limit = await checkRateLimit(accountId, 'chat')
  if (!limit.ok) return NextResponse.json({ error: !limit.ok && "message" in limit ? limit.message : `Límite alcanzado. Intentá en ${limit.retryAfterSeconds}s` }, { status: 429 })

  const { question, reelId } = await req.json()
  if (!question?.trim()) return NextResponse.json({ error: 'Question required' }, { status: 400 })

  const db = createServerSupabase()

  const [{ data: reels }, { data: account }, specificReel] = await Promise.all([
    db.from('reels').select('caption,views,multiplier,like_rate,comment_rate,hook,timestamp,is_trial,comments,permalink').eq('account_id', accountId).order('views', { ascending: false }).limit(20),
    db.from('ig_accounts').select('*').eq('id', accountId).single(),
    reelId
      ? db.from('reels').select('caption,views,likes,comments,shares,saves,multiplier,like_rate,comment_rate,hook,timestamp,is_trial,permalink,duration_seconds').eq('id', reelId).single().then(r => r.data)
      : Promise.resolve(null),
  ])

  let commentContext = ''
  if (isCommentQuery(question)) {
    try {
      const topByComments = [...(reels || [])].sort((a, b) => (b.comments || 0) - (a.comments || 0)).slice(0, 3)
      const urls = topByComments.map(r => r.permalink).filter(Boolean) as string[]
      if (urls.length) {
        const comments = await scrapeReelComments(urls, 40)
        if (comments.length) {
          commentContext = `\n\n**COMENTARIOS REALES DE LA AUDIENCIA (${comments.length} comentarios de los 3 reels más comentados):**\n${comments.map(c => `- "${c.text}"`).join('\n')}`
        }
      }
    } catch {
      // If comment scraping fails, continue without them
    }
  }

  let reelContext = ''
  if (specificReel) {
    reelContext = `\n\n**REEL ESPECÍFICO sobre el que pregunta el usuario:**\nCaption: "${specificReel.caption || '(sin caption)'}"\nViews: ${specificReel.views} | Likes: ${specificReel.likes} | Comments: ${specificReel.comments} | Shares: ${specificReel.shares} | Saves: ${specificReel.saves}\nMultiplicador: ${specificReel.multiplier}x | Like rate: ${specificReel.like_rate}% | Comment rate: ${specificReel.comment_rate}%\nDuración: ${specificReel.duration_seconds || '?'}s | Trial: ${specificReel.is_trial ? 'Sí' : 'No'}\nFecha: ${specificReel.timestamp}\nHook: ${specificReel.hook || '(no analizado)'}`
  }

  try {
    const answer = await chatWithKlar({
      question: commentContext || reelContext ? `${question}${reelContext}${commentContext ? `\n\nCONTEXTO ADICIONAL — Comentarios reales scrapeados:${commentContext}` : ''}` : question,
      reels: reels || [],
      accountStats: {
        followers: account?.followers_count,
        username: account?.username,
        total_reels: reels?.length,
      },
    })
    return NextResponse.json({ answer })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error consultando a Klar' }, { status: 500 })
  }
}
