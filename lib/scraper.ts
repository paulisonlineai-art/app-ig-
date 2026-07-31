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

const APIFY_TOKEN = process.env.APIFY_API_TOKEN || ''
const APIFY_BASE = 'https://api.apify.com/v2'

async function runApifyActor(actorId: string, input: Record<string, any>, timeoutSecs = 120): Promise<any[]> {
  const runRes = await fetch(
    `${APIFY_BASE}/acts/${actorId}/run-sync-get-dataset-items?token=${APIFY_TOKEN}&timeout=${timeoutSecs}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
      signal: AbortSignal.timeout(timeoutSecs * 1000 + 10000),
    },
  )
  if (!runRes.ok) {
    const text = await runRes.text().catch(() => '')
    throw new Error(`Apify ${actorId} failed (${runRes.status}): ${text.slice(0, 300)}`)
  }
  return runRes.json()
}

export async function scrapeInstagramUser(username: string): Promise<ApifyProfile | null> {
  try {
    const items = await runApifyActor('apify/instagram-profile-scraper', {
      usernames: [username],
    }, 60)

    const u = items?.[0]
    if (!u) return null

    return {
      id: u.id?.toString() || u.igId?.toString() || username,
      username: u.username || username,
      fullName: u.fullName || u.full_name || '',
      biography: u.biography || u.bio || '',
      profilePicUrl: u.profilePicUrlHD || u.profilePicUrl || u.profile_pic_url_hd || u.profile_pic_url || '',
      followersCount: u.followersCount ?? u.followedByCount ?? u.edge_followed_by?.count ?? 0,
      followsCount: u.followsCount ?? u.followingCount ?? u.edge_follow?.count ?? 0,
      postsCount: u.postsCount ?? u.mediaCount ?? u.edge_owner_to_timeline_media?.count ?? 0,
      isVerified: u.verified ?? u.isVerified ?? false,
      isBusinessAccount: u.isBusinessAccount ?? u.is_business_account ?? false,
    }
  } catch (e) {
    console.error(`[apify] profile scrape failed for ${username}:`, e)
    return null
  }
}

function parseApifyReel(item: any): ApifyReel | null {
  const isVideo = item.type === 'Video' || item.videoUrl || item.videoViewCount > 0 || item.productType === 'clips'
  if (!isVideo) return null

  const shortCode = item.shortCode || item.code || ''
  return {
    id: item.id || shortCode,
    shortCode,
    url: item.url || `https://www.instagram.com/reel/${shortCode}/`,
    displayUrl: item.displayUrl || item.thumbnailUrl || '',
    videoUrl: item.videoUrl || '',
    caption: item.caption || '',
    timestamp: item.timestamp
      ? new Date(item.timestamp).toISOString()
      : new Date().toISOString(),
    likesCount: item.likesCount ?? 0,
    commentsCount: item.commentsCount ?? 0,
    videoViewCount: item.videoViewCount ?? item.videoPlayCount ?? item.playCount ?? 0,
    videoPlayCount: item.videoPlayCount ?? item.playCount ?? 0,
    videoDuration: item.videoDuration ?? 0,
    isSponsored: item.isPaidPartnership ?? item.isSponsored ?? false,
    type: 'Video',
  }
}

export async function scrapeOwnReels(username: string, limit = 50): Promise<{
  reels: ApifyReel[]
  trialShortCodes: Set<string>
}> {
  const trialShortCodes = new Set<string>()

  try {
    const items = await runApifyActor('apify/instagram-scraper', {
      directUrls: [`https://www.instagram.com/${username}/reels/`],
      resultsType: 'reels',
      resultsLimit: limit,
    }, 180)

    const reels: ApifyReel[] = []
    for (const item of items) {
      const reel = parseApifyReel(item)
      if (!reel) continue

      // Trial reels: very low views (< 5) or null views
      const views = item.videoViewCount ?? item.videoPlayCount
      if (views === null || views === undefined || views < 5) {
        trialShortCodes.add(reel.shortCode)
      }

      reels.push(reel)
    }

    return { reels, trialShortCodes }
  } catch (e) {
    console.error(`[apify] reels scrape failed for ${username}:`, e)
    return { reels: [], trialShortCodes }
  }
}

export async function scrapeCompetitorReels(username: string, limit = 20): Promise<ApifyReel[]> {
  const { reels } = await scrapeOwnReels(username, limit * 2)
  return reels
    .sort((a, b) => (b.videoViewCount || 0) - (a.videoViewCount || 0))
    .slice(0, limit)
}

export async function scrapeReelComments(reelUrls: string[], limit = 50): Promise<{ reelUrl: string; username: string; text: string }[]> {
  if (!reelUrls.length) return []

  try {
    const items = await runApifyActor('apify/instagram-comment-scraper', {
      directUrls: reelUrls.slice(0, 10),
      resultsLimit: Math.min(limit, 50),
    }, 120)

    return items
      .filter((c: any) => c.text?.trim())
      .map((c: any) => ({
        reelUrl: c.postUrl || c.inputUrl || reelUrls[0],
        username: c.ownerUsername || c.username || '',
        text: c.text,
      }))
      .slice(0, limit)
  } catch (e) {
    console.error(`[apify] comments scrape failed:`, e)
    return []
  }
}
