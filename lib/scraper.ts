export interface ApifyReel {
  id: string
  shortCode: string
  url: string
  displayUrl: string
  videoUrl: string
  caption: string
  timestamp: string
  likesCount: number
  commentsCount: number
  videoViewCount: number
  videoPlayCount: number
  videoDuration: number
  isSponsored: boolean
  type: string
}

export interface ApifyProfile {
  id: string
  username: string
  fullName: string
  biography: string
  profilePicUrl: string
  followersCount: number
  followsCount: number
  postsCount: number
  isVerified: boolean
  isBusinessAccount: boolean
}

const IG_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  'X-IG-App-ID': '936619743392459',
  'X-Requested-With': 'XMLHttpRequest',
  'Accept': '*/*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Sec-Fetch-Site': 'same-origin',
  'Referer': 'https://www.instagram.com/',
}

async function fetchIG(url: string, sessionCookie?: string): Promise<any> {
  const headers: Record<string, string> = { ...IG_HEADERS }
  if (sessionCookie) {
    headers['Cookie'] = `sessionid=${sessionCookie}`
  }

  const res = await fetch(url, { headers, next: { revalidate: 0 } })
  if (!res.ok) {
    throw new Error(`Instagram API error: ${res.status} ${res.statusText}`)
  }
  return res.json()
}

export async function scrapeInstagramUser(username: string, sessionCookie?: string): Promise<ApifyProfile | null> {
  try {
    const data = await fetchIG(
      `https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(username)}`,
      sessionCookie,
    )
    const u = data?.data?.user
    if (!u) return null

    return {
      id: u.id || u.pk?.toString() || username,
      username: u.username,
      fullName: u.full_name || '',
      biography: u.biography || '',
      profilePicUrl: u.profile_pic_url_hd || u.profile_pic_url || '',
      followersCount: u.edge_followed_by?.count || u.follower_count || 0,
      followsCount: u.edge_follow?.count || u.following_count || 0,
      postsCount: u.edge_owner_to_timeline_media?.count || u.media_count || 0,
      isVerified: u.is_verified || false,
      isBusinessAccount: u.is_business_account || u.is_professional_account || false,
    }
  } catch (e) {
    console.error(`[scraper] Failed to fetch profile for ${username}:`, e)
    return null
  }
}

function parseMediaEdge(node: any): ApifyReel | null {
  const isVideo = node.is_video || node.__typename === 'GraphVideo' || node.media_type === 2
  if (!isVideo) return null

  const shortCode = node.shortcode || node.code || ''
  return {
    id: node.id || shortCode,
    shortCode,
    url: `https://www.instagram.com/reel/${shortCode}/`,
    displayUrl: node.display_url || node.thumbnail_src || node.image_versions2?.candidates?.[0]?.url || '',
    videoUrl: node.video_url || '',
    caption: node.edge_media_to_caption?.edges?.[0]?.node?.text || node.caption?.text || '',
    timestamp: node.taken_at_timestamp
      ? new Date(node.taken_at_timestamp * 1000).toISOString()
      : node.taken_at
        ? new Date(node.taken_at * 1000).toISOString()
        : new Date().toISOString(),
    likesCount: node.edge_media_preview_like?.count ?? node.like_count ?? 0,
    commentsCount: node.edge_media_to_comment?.count ?? node.comment_count ?? 0,
    videoViewCount: node.video_view_count || node.video_play_count || node.play_count || 0,
    videoPlayCount: node.video_play_count || node.play_count || 0,
    videoDuration: node.video_duration || 0,
    isSponsored: node.is_paid_partnership || false,
    type: 'Video',
  }
}

export async function scrapeOwnReels(username: string, limit = 50): Promise<{
  reels: ApifyReel[]
  trialShortCodes: Set<string>
}> {
  const reels: ApifyReel[] = []

  try {
    const data = await fetchIG(
      `https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(username)}`,
    )
    const user = data?.data?.user
    if (!user) return { reels: [], trialShortCodes: new Set() }

    const edges = user.edge_owner_to_timeline_media?.edges || []
    for (const edge of edges) {
      const reel = parseMediaEdge(edge.node)
      if (reel) reels.push(reel)
    }

    // Also try the reels tab endpoint for more reels
    if (user.id || user.pk) {
      const userId = user.id || user.pk?.toString()
      try {
        const reelsData = await fetchIG(
          `https://www.instagram.com/graphql/query/?query_hash=d4d88dc1500312af6f937f7b804c68c3&variables=${encodeURIComponent(JSON.stringify({ id: userId, first: Math.min(limit, 50) }))}`,
        )
        const reelEdges = reelsData?.data?.user?.edge_owner_to_timeline_media?.edges || []
        const existingCodes = new Set(reels.map(r => r.shortCode))
        for (const edge of reelEdges) {
          const reel = parseMediaEdge(edge.node)
          if (reel && !existingCodes.has(reel.shortCode)) {
            reels.push(reel)
            existingCodes.add(reel.shortCode)
          }
        }
      } catch {
        // graphql endpoint may fail, that's ok — we have the basic media
      }
    }
  } catch (e) {
    console.error(`[scraper] Failed to fetch reels for ${username}:`, e)
  }

  return { reels: reels.slice(0, limit), trialShortCodes: new Set() }
}

export async function scrapeCompetitorReels(username: string, limit = 20): Promise<ApifyReel[]> {
  const { reels } = await scrapeOwnReels(username, limit * 2)
  return reels
    .sort((a, b) => (b.videoViewCount || 0) - (a.videoViewCount || 0))
    .slice(0, limit)
}

export async function scrapeReelComments(reelUrls: string[], limit = 50): Promise<{ reelUrl: string; username: string; text: string }[]> {
  const comments: { reelUrl: string; username: string; text: string }[] = []

  for (const url of reelUrls) {
    try {
      const shortCode = url.match(/\/reel\/([^/?]+)/)?.[1] || url.match(/\/p\/([^/?]+)/)?.[1]
      if (!shortCode) continue

      const data = await fetchIG(
        `https://www.instagram.com/graphql/query/?query_hash=bc3296d1ce80a24b1b6e40b1e72903f5&variables=${encodeURIComponent(JSON.stringify({ shortcode: shortCode, first: Math.min(limit, 50) }))}`,
      )
      const edges = data?.data?.shortcode_media?.edge_media_to_parent_comment?.edges || []
      for (const edge of edges) {
        const node = edge.node
        if (node?.text?.trim()) {
          comments.push({
            reelUrl: url,
            username: node.owner?.username || '',
            text: node.text,
          })
        }
      }
    } catch {
      // individual reel comment fetch failed, continue
    }
  }

  return comments.slice(0, limit)
}
