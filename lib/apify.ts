import { ApifyClient } from 'apify-client'

const client = new ApifyClient({ token: process.env.APIFY_API_TOKEN })

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

// Fetch this account's own reels AND which of them are trial reels, from a
// single Apify actor (apify/instagram-reel-scraper) instead of two different
// actors. Previously reels came from apify/instagram-scraper (posts) while
// trial-detection came from apify/instagram-reel-scraper — two disjoint
// scrapes whose shortCodes never lined up, so a reel could never actually
// get flagged is_trial even when trial codes were found. Sourcing both the
// reel list and the trial flag from the exact same dataset guarantees the
// shortCodes match, and it costs one fewer Apify actor call per sync.
// Public accounts only — this actor has no session cookie support.
export async function scrapeOwnReels(username: string, limit = 50): Promise<{
  reels: ApifyReel[]
  trialShortCodes: Set<string>
}> {
  const [withTrial, withoutTrial] = await Promise.all([
    client.actor('apify/instagram-reel-scraper').call(
      { username: [username], resultsLimit: limit, skipTrialReels: false },
      { waitSecs: 120 }
    ),
    client.actor('apify/instagram-reel-scraper').call(
      { username: [username], resultsLimit: limit, skipTrialReels: true },
      { waitSecs: 120 }
    ),
  ])

  const [{ items: allItems }, { items: noTrialItems }] = await Promise.all([
    client.dataset(withTrial.defaultDatasetId).listItems(),
    client.dataset(withoutTrial.defaultDatasetId).listItems(),
  ])

  const noTrialCodes = new Set((noTrialItems as any[]).map(i => i.shortCode))
  const trialShortCodes = new Set(
    (allItems as any[])
      .map(i => i.shortCode)
      .filter(code => code && !noTrialCodes.has(code))
  )

  const reels: ApifyReel[] = (allItems as any[])
    .filter(item => item.type === 'Video' || item.videoViewCount > 0 || trialShortCodes.has(item.shortCode))
    .map(item => ({
      id: item.id || item.shortCode,
      shortCode: item.shortCode,
      url: item.url || `https://www.instagram.com/reel/${item.shortCode}/`,
      displayUrl: item.displayUrl || '',
      videoUrl: item.videoUrl || '',
      caption: item.caption || '',
      timestamp: item.timestamp,
      likesCount: item.likesCount || 0,
      commentsCount: item.commentsCount || 0,
      videoViewCount: item.videoViewCount || item.videoPlayCount || 0,
      videoPlayCount: item.videoPlayCount || 0,
      videoDuration: item.videoDuration || 0,
      isSponsored: item.isSponsored || false,
      type: item.type || 'Reel',
    }))

  return { reels, trialShortCodes }
}

// Fetch just profile info
export async function scrapeInstagramUser(username: string, sessionCookie?: string): Promise<ApifyProfile | null> {
  const input: Record<string, any> = {
    usernames: [username],
  }
  if (sessionCookie) input.sessionCookieString = sessionCookie

  const run = await client.actor('apify/instagram-profile-scraper').call(input, { waitSecs: 60 })
  const { items } = await client.dataset(run.defaultDatasetId).listItems()

  if (!items.length) return null

  const u = items[0] as any
  return {
    id: u.id || u.username,
    username: u.username,
    fullName: u.fullName || u.name || '',
    biography: u.biography || u.bio || '',
    profilePicUrl: u.profilePicUrl || u.profilePicUrlHD || '',
    followersCount: u.followersCount || u.followersCount || 0,
    followsCount: u.followsCount || u.followingCount || 0,
    postsCount: u.postsCount || u.mediaCount || 0,
    isVerified: u.verified || false,
    isBusinessAccount: u.isBusinessAccount || false,
  }
}

// Scrape reels for a competitor (public, no session needed). Apify only
// ever returns a profile's most recent posts — there's no way to ask it
// for "the most viral reel ever" without scraping the account's entire
// history (a lot more Apify credits). Instead we scrape a wider recent
// pool and keep the top performers by views within that pool, so tracked
// reels are "most viral among what they've posted lately" rather than
// strictly the newest ones.
export async function scrapeCompetitorReels(username: string, limit = 20): Promise<ApifyReel[]> {
  const poolSize = Math.max(limit * 3, 50)
  const run = await client.actor('apify/instagram-scraper').call({
    directUrls: [`https://www.instagram.com/${username}/`],
    resultsType: 'posts',
    resultsLimit: poolSize,
  }, { waitSecs: 120 })

  const { items } = await client.dataset(run.defaultDatasetId).listItems()

  const reels = (items as any[])
    .filter(item => item.type === 'Video' || item.videoViewCount > 0)
    .map(item => ({
      id: item.id || item.shortCode,
      shortCode: item.shortCode,
      url: item.url || `https://www.instagram.com/reel/${item.shortCode}/`,
      displayUrl: item.displayUrl || '',
      videoUrl: item.videoUrl || '',
      caption: item.caption || '',
      timestamp: item.timestamp,
      likesCount: item.likesCount || 0,
      commentsCount: item.commentsCount || 0,
      videoViewCount: item.videoViewCount || 0,
      videoPlayCount: item.videoPlayCount || 0,
      videoDuration: item.videoDuration || 0,
      isSponsored: item.isSponsored || false,
      type: item.type || 'Reel',
    }))

  return reels
    .sort((a, b) => (b.videoViewCount || b.videoPlayCount || 0) - (a.videoViewCount || a.videoPlayCount || 0))
    .slice(0, limit)
}
