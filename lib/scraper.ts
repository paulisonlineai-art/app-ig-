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

async function fetchIG(url: string, sessionCookie?: string): Promise<any> {
  const headers: Record<string, string> = {
    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
    'Accept': '*/*',
    'Accept-Language': 'en-US,en;q=0.9',
    'X-IG-App-ID': '936619743392459',
    'X-Requested-With': 'XMLHttpRequest',
    'Sec-Fetch-Site': 'same-origin',
    'Sec-Fetch-Mode': 'cors',
    'Referer': 'https://www.instagram.com/',
    'Origin': 'https://www.instagram.com',
  }
  if (sessionCookie) {
    headers['Cookie'] = `sessionid=${sessionCookie}`
  }

  const res = await fetch(url, {
    headers,
    cache: 'no-store',
    signal: AbortSignal.timeout(15000),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`IG ${res.status}: ${text.slice(0, 200)}`)
  }
  return res.json()
}

function parseProfileData(u: any): ApifyProfile {
  return {
    id: u.id || u.pk?.toString() || u.username || '',
    username: u.username || '',
    fullName: u.full_name || u.fullName || '',
    biography: u.biography || u.bio || '',
    profilePicUrl: u.profile_pic_url_hd || u.profile_pic_url || u.profilePicUrl || '',
    followersCount: u.edge_followed_by?.count || u.follower_count || u.followersCount || 0,
    followsCount: u.edge_follow?.count || u.following_count || u.followsCount || 0,
    postsCount: u.edge_owner_to_timeline_media?.count || u.media_count || u.postsCount || 0,
    isVerified: u.is_verified || false,
    isBusinessAccount: u.is_business_account || u.is_professional_account || false,
  }
}

export async function scrapeInstagramUser(username: string, sessionCookie?: string): Promise<ApifyProfile | null> {
  // Strategy 1: web_profile_info API
  try {
    const data = await fetchIG(
      `https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(username)}`,
      sessionCookie,
    )
    const u = data?.data?.user
    if (u) return parseProfileData(u)
  } catch (e) {
    console.error(`[scraper] web_profile_info failed for ${username}:`, e)
  }

  // Strategy 2: HTML page scrape (extract shared_data JSON)
  try {
    const res = await fetch(`https://www.instagram.com/${encodeURIComponent(username)}/`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      cache: 'no-store',
      redirect: 'follow',
      signal: AbortSignal.timeout(15000),
    })
    if (res.ok) {
      const html = await res.text()

      // Try to extract from meta tags
      const ogTitle = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/)?.[1]
      const ogDesc = html.match(/<meta\s+property="og:description"\s+content="([^"]+)"/)?.[1]
      const ogImage = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/)?.[1]

      if (ogTitle || ogDesc) {
        const followersMatch = ogDesc?.match(/([\d,.]+[KMkm]?)\s*Followers/i)
        const followingMatch = ogDesc?.match(/([\d,.]+[KMkm]?)\s*Following/i)
        const postsMatch = ogDesc?.match(/([\d,.]+[KMkm]?)\s*Posts/i)

        const parseCount = (s?: string): number => {
          if (!s) return 0
          const n = parseFloat(s.replace(/,/g, ''))
          if (s.match(/[Kk]$/)) return n * 1000
          if (s.match(/[Mm]$/)) return n * 1_000_000
          return n
        }

        return {
          id: username,
          username,
          fullName: ogTitle?.replace(/\s*\(@[^)]+\).*/, '') || '',
          biography: '',
          profilePicUrl: ogImage || '',
          followersCount: parseCount(followersMatch?.[1]),
          followsCount: parseCount(followingMatch?.[1]),
          postsCount: parseCount(postsMatch?.[1]),
          isVerified: false,
          isBusinessAccount: false,
        }
      }
    }
  } catch (e) {
    console.error(`[scraper] HTML fallback failed for ${username}:`, e)
  }

  // Strategy 3: i.instagram.com mobile API (needs session cookie)
  if (sessionCookie) {
    try {
      const searchData = await fetchIG(
        `https://i.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(username)}`,
        sessionCookie,
      )
      const u = searchData?.data?.user
      if (u) return parseProfileData(u)
    } catch (e) {
      console.error(`[scraper] mobile API failed for ${username}:`, e)
    }
  }

  console.error(`[scraper] All strategies failed for ${username}`)
  return null
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
  const trialShortCodes = new Set<string>()

  try {
    const data = await fetchIG(
      `https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(username)}`,
    )
    const user = data?.data?.user
    if (!user) return { reels: [], trialShortCodes }

    // 1. Profile grid media — these are NON-trial reels (trials don't
    //    appear on the profile grid by default)
    const gridEdges = user.edge_owner_to_timeline_media?.edges || []
    const gridCodes = new Set<string>()
    for (const edge of gridEdges) {
      const node = edge.node
      const code = node.shortcode || node.code
      if (code) gridCodes.add(code)
      const reel = parseMediaEdge(node)
      if (reel) reels.push(reel)
    }

    // 2. Fetch the clips/reels tab — this includes ALL reels including trials
    const userId = user.id || user.pk?.toString()
    if (userId) {
      try {
        const clipsData = await fetchIG(
          `https://www.instagram.com/graphql/query/?query_hash=bc78b344a68ed16dd5d7f264681c4c76&variables=${encodeURIComponent(JSON.stringify({
            id: userId,
            first: Math.min(limit, 50),
          }))}`,
        )
        const clipEdges = clipsData?.data?.user?.edge_felix_video_timeline?.edges || []
        const existingCodes = new Set(reels.map(r => r.shortCode))

        for (const edge of clipEdges) {
          const reel = parseMediaEdge(edge.node)
          if (!reel) continue

          // Reel in clips tab but NOT on profile grid = trial reel
          if (!gridCodes.has(reel.shortCode)) {
            trialShortCodes.add(reel.shortCode)
          }

          if (!existingCodes.has(reel.shortCode)) {
            reels.push(reel)
            existingCodes.add(reel.shortCode)
          }
        }
      } catch {
        // clips endpoint may fail — we still have grid media
      }

      // 3. Also check individual reel metadata for trial indicators
      //    Instagram sometimes marks trials with audience or
      //    share_to_feed fields
      try {
        const reelsData = await fetchIG(
          `https://www.instagram.com/graphql/query/?query_hash=d4d88dc1500312af6f937f7b804c68c3&variables=${encodeURIComponent(JSON.stringify({ id: userId, first: Math.min(limit, 50) }))}`,
        )
        const reelEdges = reelsData?.data?.user?.edge_owner_to_timeline_media?.edges || []
        const existingCodes = new Set(reels.map(r => r.shortCode))
        for (const edge of reelEdges) {
          const node = edge.node
          // Check for trial indicators in metadata
          if (node.audience === 'non_followers' || node.is_trial === true) {
            const code = node.shortcode || node.code
            if (code) trialShortCodes.add(code)
          }
          const reel = parseMediaEdge(node)
          if (reel && !existingCodes.has(reel.shortCode)) {
            reels.push(reel)
            existingCodes.add(reel.shortCode)
          }
        }
      } catch {
        // fallback — we already have reels from other endpoints
      }
    }
  } catch (e) {
    console.error(`[scraper] Failed to fetch reels for ${username}:`, e)
  }

  if (trialShortCodes.size > 0) {
    console.log(`[scraper] Found ${trialShortCodes.size} trial reel(s) for ${username}`)
  }

  return { reels: reels.slice(0, limit), trialShortCodes }
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
