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
  if (!limit.ok) return NextResponse.json({ error: `Esperá ${limit.retryAfterSeconds}s antes de preguntar de nuevo` }, { status: 429 })

  const { question, reelId } = await req.json()
  if (!question?.trim()) return NextResponse.json({ error: 'Question required' }, { status: 400 })

  const db = createServerSupabase()

  const [{ data: reels }, { data: account }] = await Promise.all([
    db.from('reels').select('caption,views,multiplier,like_rate,comment_rate,hook,timestamp,is_trial,comments,permalink').eq('account_id', accountId).order('views', { ascending: false }).limit(20),
    db.from('ig_accounts').select('*').eq('id', accountId).single(),
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

  try {
    const answer = await chatWithKlar({
      question: commentContext ? `${question}\n\nCONTEXTO ADICIONAL — Comentarios reales scrapeados:${commentContext}` : question,
      reels: reels || [],
      accountStats: {
        followers: account?.followers_count,
        username: account?.username,
        total_reels: reels?.length,
      },
    })
    return NextResponse.json({ answer })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Error consultando a Klar' }, { status: 500 })
  }
}
