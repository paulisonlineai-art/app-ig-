/**
 * lib/instagram.ts
 * Official Instagram Graph API v21.0 client.
 * Replaces lib/scraper.ts (Apify-based scraping).
 *
 * All functions use long-lived user access tokens stored in ig_accounts.
 * Base URL: https://graph.instagram.com/v21.0
 */

const GRAPH_BASE = 'https://graph.instagram.com/v21.0'

// ---------------------------------------------------------------------------
// Error types
// ---------------------------------------------------------------------------

export class IGExpiredTokenError extends Error {
  constructor(message = 'Instagram access token has expired') {
    super(message)
    this.name = 'IGExpiredTokenError'
  }
}

export class IGRateLimitError extends Error {
  retryAfter: number
  constructor(retryAfter = 3600) {
    super(`Instagram Graph API rate limit reached. Retry after ${retryAfter}s`)
    this.name = 'IGRateLimitError'
    this.retryAfter = retryAfter
  }
}

export class IGPermissionError extends Error {
  constructor(message = 'Missing required Instagram permission') {
    super(message)
    this.name = 'IGPermissionError'
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function graphFetch(path: string, token: string, params: Record<string, string> = {}): Promise<any> {
  const url = new URL(`${GRAPH_BASE}${path}`)
  url.searchParams.set('access_token', token)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)

  const res = await fetch(url.toString(), {
    signal: AbortSignal.timeout(30000),
  })

  const data = await res.json()

  if (!res.ok || data.error) {
    const err = data.error || {}
    const code = err.code ?? res.status
    const msg: string = err.message ?? `HTTP ${res.status}`

    // Token expired / invalid
    if (code === 190 || msg.toLowerCase().includes('invalid oauth') || msg.toLowerCase().includes('session has been invalidated')) {
      throw new IGExpiredTokenError(msg)
    }
    // Rate limit
    if (code === 4 || code === 17 || code === 32 || code === 613 || res.status === 429) {
      const retryAfter = parseInt(res.headers.get('retry-after') ?? '3600', 10)
      throw new IGRateLimitError(retryAfter)
    }
    // Permission / scope
    if (code === 10 || code === 200 || code === 230 || msg.toLowerCase().includes('permission')) {
      throw new IGPermissionError(msg)
    }

    throw new Error(`[instagram] Graph API error (${code}): ${msg}`)
  }

  return data
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface IGProfile {
  id: string
  username: string
  name: string
  biography: string
  profile_picture_url: string
  followers_count: number
  media_count: number
  account_type: 'BUSINESS' | 'CREATOR' | 'PERSONAL' | string
}

export interface IGMedia {
  id: string
  caption: string | null
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM'
  media_url: string | null
  thumbnail_url: string | null
  permalink: string
  timestamp: string
  like_count: number
  comments_count: number
}

export interface IGMediaInsights {
  plays: number
  reach: number
  saved: number
  shares: number
  total_interactions: number
  likes: number
  comments: number
}

export interface IGCompetitorProfile {
  id: string
  username: string
  name: string
  profile_picture_url: string | null
  followers_count: number
  media_count: number
  media: IGMedia[]
}

export interface IGTokenRefresh {
  access_token: string
  token_type: string
  expires_in: number
}

// ---------------------------------------------------------------------------
// Public API functions
// ---------------------------------------------------------------------------

/**
 * Fetch the authenticated user's Instagram profile.
 * Fields: id, username, name, biography, profile_picture_url, followers_count, media_count, account_type
 */
export async function getInstagramProfile(accessToken: string): Promise<IGProfile> {
  const data = await graphFetch('/me', accessToken, {
    fields: 'id,username,name,biography,profile_picture_url,followers_count,media_count,account_type',
  })

  return {
    id: data.id,
    username: data.username ?? '',
    name: data.name ?? '',
    biography: data.biography ?? '',
    profile_picture_url: data.profile_picture_url ?? '',
    followers_count: data.followers_count ?? 0,
    media_count: data.media_count ?? 0,
    account_type: data.account_type ?? 'PERSONAL',
  }
}

/**
 * Fetch the authenticated user's media, filtered to REELS and VIDEO types only.
 * Uses GET /me/media with basic fields.
 */
export async function getInstagramMedia(accessToken: string, limit = 50): Promise<IGMedia[]> {
  const data = await graphFetch('/me/media', accessToken, {
    fields: 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count',
    limit: String(limit),
  })

  const items: IGMedia[] = (data.data ?? []).filter(
    (item: any) => item.media_type === 'VIDEO' || item.media_type === 'REELS',
  )

  return items.map((item: any) => ({
    id: item.id,
    caption: item.caption ?? null,
    media_type: item.media_type,
    media_url: item.media_url ?? null,
    thumbnail_url: item.thumbnail_url ?? null,
    permalink: item.permalink,
    timestamp: item.timestamp,
    like_count: item.like_count ?? 0,
    comments_count: item.comments_count ?? 0,
  }))
}

/**
 * Fetch insights for a single media item (reel/video).
 * Note: metric names differ from basic fields — "plays" not "views", "saved" not "saves".
 * Requires instagram_manage_insights permission.
 */
export async function getMediaInsights(accessToken: string, mediaId: string): Promise<IGMediaInsights> {
  try {
    const data = await graphFetch(`/${mediaId}/insights`, accessToken, {
      metric: 'plays,reach,saved,shares,total_interactions,likes,comments',
    })

    const metrics: Record<string, number> = {}
    for (const m of data.data ?? []) {
      metrics[m.name] = m.values?.[0]?.value ?? m.value ?? 0
    }

    return {
      plays: metrics.plays ?? 0,
      reach: metrics.reach ?? 0,
      saved: metrics.saved ?? 0,
      shares: metrics.shares ?? 0,
      total_interactions: metrics.total_interactions ?? 0,
      likes: metrics.likes ?? 0,
      comments: metrics.comments ?? 0,
    }
  } catch (e) {
    // Insights may not be available for older media — return zeroed object
    if (e instanceof IGPermissionError || (e instanceof Error && e.message.includes('insights'))) {
      console.warn(`[instagram] insights not available for media ${mediaId}:`, e.message)
      return { plays: 0, reach: 0, saved: 0, shares: 0, total_interactions: 0, likes: 0, comments: 0 }
    }
    throw e
  }
}

/**
 * Fetch a competitor's public Instagram profile and recent media via the
 * Business Discovery API. Requires the authenticated user's account to be
 * Business or Creator.
 *
 * @param accessToken - The authenticated user's long-lived token
 * @param igUserId    - The authenticated user's numeric IG user ID (from ig_accounts.ig_user_id_numeric)
 * @param competitorUsername - The competitor's Instagram username
 */
export async function getCompetitorProfile(
  accessToken: string,
  igUserId: string,
  competitorUsername: string,
): Promise<IGCompetitorProfile> {
  const fields = [
    'business_discovery.fields(',
    'id,username,name,profile_picture_url,followers_count,media_count,',
    'media.limit(20){id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count}',
    ')',
  ].join('')

  const data = await graphFetch(`/${igUserId}`, accessToken, {
    fields,
    ig_user_id: igUserId,
    username: competitorUsername,
  })

  const biz = data.business_discovery
  if (!biz) throw new IGPermissionError('Business Discovery API returned no data — account may not be Business/Creator')

  const media: IGMedia[] = (biz.media?.data ?? [])
    .filter((item: any) => item.media_type === 'VIDEO' || item.media_type === 'REELS')
    .map((item: any) => ({
      id: item.id,
      caption: item.caption ?? null,
      media_type: item.media_type,
      media_url: item.media_url ?? null,
      thumbnail_url: item.thumbnail_url ?? null,
      permalink: item.permalink,
      timestamp: item.timestamp,
      like_count: item.like_count ?? 0,
      comments_count: item.comments_count ?? 0,
    }))

  return {
    id: biz.id,
    username: biz.username ?? competitorUsername,
    name: biz.name ?? '',
    profile_picture_url: biz.profile_picture_url ?? null,
    followers_count: biz.followers_count ?? 0,
    media_count: biz.media_count ?? 0,
    media,
  }
}

/**
 * Refresh a long-lived Instagram access token before it expires.
 * Long-lived tokens expire after 60 days. Refresh when < 7 days remain.
 * Returns the new token and its TTL in seconds.
 */
export async function refreshLongLivedToken(token: string): Promise<IGTokenRefresh> {
  const url = new URL(`${GRAPH_BASE}/refresh_access_token`)
  url.searchParams.set('grant_type', 'ig_refresh_token')
  url.searchParams.set('access_token', token)

  const res = await fetch(url.toString(), { signal: AbortSignal.timeout(15000) })
  const data = await res.json()

  if (!res.ok || data.error) {
    const err = data.error || {}
    if (err.code === 190) throw new IGExpiredTokenError(err.message)
    throw new Error(`[instagram] token refresh failed: ${err.message ?? res.status}`)
  }

  return {
    access_token: data.access_token,
    token_type: data.token_type ?? 'bearer',
    expires_in: data.expires_in ?? 5183944, // ~60 days
  }
}
