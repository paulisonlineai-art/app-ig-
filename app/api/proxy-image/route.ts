import { NextRequest, NextResponse } from 'next/server'

// Only Instagram/Facebook's own CDN hosts are ever legitimate values here —
// this endpoint exists purely to work around IG's hotlink protection for
// thumbnails. Without a whitelist it's an open SSRF proxy (fetch any URL,
// server-side, on Moka's behalf).
//
// Must be exact-match-or-subdomain, never suffix match: `endsWith('instagram.com')`
// would also accept `evilinstagram.com`, letting an attacker's own host through.
const ALLOWED_HOSTS = ['cdninstagram.com', 'fbcdn.net', 'instagram.com', 'fbsbx.com']

function isAllowedHost(hostname: string): boolean {
  return ALLOWED_HOSTS.some(domain => hostname === domain || hostname.endsWith(`.${domain}`))
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')
  if (!url) return new NextResponse('Missing url', { status: 400 })

  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return new NextResponse('Invalid url', { status: 400 })
  }
  if (parsed.protocol !== 'https:' || !isAllowedHost(parsed.hostname)) {
    return new NextResponse('Host not allowed', { status: 400 })
  }

  try {
    const res = await fetch(url, {
      // Don't auto-follow redirects — a whitelisted host could redirect to an
      // internal/arbitrary address and the final destination would never get
      // re-checked against the whitelist.
      redirect: 'manual',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.instagram.com/',
      },
    })

    if (!res.ok) return new NextResponse('Image not found', { status: 404 })

    const contentType = res.headers.get('content-type') || 'image/jpeg'
    const buffer = await res.arrayBuffer()

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
      },
    })
  } catch {
    return new NextResponse('Error fetching image', { status: 500 })
  }
}
