import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'

const ALLOWED_HOSTS = ['cdninstagram.com', 'fbcdn.net', 'instagram.com', 'fbsbx.com']

function isAllowedHost(hostname: string): boolean {
  return ALLOWED_HOSTS.some(domain => hostname === domain || hostname.endsWith(`.${domain}`))
}

async function fetchImage(url: string): Promise<{ buffer: ArrayBuffer; contentType: string } | null> {
  try {
    let currentUrl = url
    for (let hops = 0; hops < 5; hops++) {
      const parsed = new URL(currentUrl)
      if (parsed.protocol !== 'https:' || !isAllowedHost(parsed.hostname)) return null

      const res = await fetch(currentUrl, {
        redirect: 'manual',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://www.instagram.com/',
        },
      })
      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get('location')
        if (!location) return null
        currentUrl = new URL(location, currentUrl).href
        continue
      }
      if (!res.ok) return null
      return {
        buffer: await res.arrayBuffer(),
        contentType: res.headers.get('content-type') || 'image/jpeg',
      }
    }
  } catch {}
  return null
}

export async function GET(req: NextRequest) {
  const accountId = req.nextUrl.searchParams.get('id')
  const type = req.nextUrl.searchParams.get('type') || 'account'
  if (!accountId) return new NextResponse('Missing id', { status: 400 })

  const db = createServerSupabase()

  let picUrl: string | null = null
  let username: string | null = null

  if (type === 'competitor') {
    const { data } = await db.from('competitors').select('profile_picture_url, ig_username').eq('id', accountId).single()
    picUrl = data?.profile_picture_url || null
    username = data?.ig_username || null
  } else {
    const { data } = await db.from('ig_accounts').select('profile_picture_url, username').eq('id', accountId).single()
    picUrl = data?.profile_picture_url || null
    username = data?.username || null
  }

  if (!picUrl) return new NextResponse(null, { status: 404 })

  const result = await fetchImage(picUrl)
  if (result) {
    return new NextResponse(result.buffer, {
      headers: {
        'Content-Type': result.contentType,
        'Cache-Control': 'public, max-age=3600',
      },
    })
  }

  // URL expired — try to get a fresh one from Instagram via a lightweight fetch
  if (username) {
    try {
      const freshRes = await fetch(`https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'X-IG-App-ID': '936619743392459',
        },
      })
      if (freshRes.ok) {
        const data = await freshRes.json()
        const newPicUrl = data?.data?.user?.profile_pic_url_hd || data?.data?.user?.profile_pic_url
        if (newPicUrl) {
          // Update DB with fresh URL
          if (type === 'competitor') {
            await db.from('competitors').update({ profile_picture_url: newPicUrl }).eq('id', accountId)
          } else {
            await db.from('ig_accounts').update({ profile_picture_url: newPicUrl }).eq('id', accountId)
          }
          const freshResult = await fetchImage(newPicUrl)
          if (freshResult) {
            return new NextResponse(freshResult.buffer, {
              headers: {
                'Content-Type': freshResult.contentType,
                'Cache-Control': 'public, max-age=3600',
              },
            })
          }
        }
      }
    } catch {}
  }

  return new NextResponse(null, { status: 404 })
}
