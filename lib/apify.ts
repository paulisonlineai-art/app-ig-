import { ApifyClient } from 'apify-client'

const client = new ApifyClient({ token: process.env.APIFY_API_TOKEN })

export interface ApifyReel {
  id: string
  shortCode: string
  url: string
  displayUrl: string
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

// Fetch profile + recent reels for a username
export async function scrapeInstagramProfile(username: string, sessionCookie?: string): Promise<{
  profile: ApifyProfile | null
  reels: ApifyReel[]
}> {
  const input: Record<string, any> = {
    directUrls: [`https://www.instagram.com/${username}/`],
    resultsType: 'posts',
    resultsLimit: 50,
    addParentData: true,
    searchType: 'user',
  }

  if (sessionCookie) {
    input.sessionCookieString = sessionCookie
  }

  const run = await client.actor('apify/instagram-scraper').call(input, { waitSecs: 120 })
  const { items } = await client.dataset(run.defaultDatasetId).listItems()

  const reels: ApifyReel[] = (items as any[])
    .filter(item => item.type === 'Video' || item.type === 'Reel' || item.videoViewCount > 0)
    .map(item => ({
      id: item.id || item.shortCode,
      shortCode: item.shortCode,
      url: item.url || `https://www.instagram.com/reel/${item.shortCode}/`,
      displayUrl: item.displayUrl || item.thumbnailUrl || '',
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

  // Profile comes as owner in items, or from a separate profile fetch
  const firstItem = items[0] as any
  const ownerData = firstItem?.ownerFullName ? {
    id: firstItem.ownerId || username,
    username: firstItem.ownerUsername || username,
    fullName: firstItem.ownerFullName || '',
    biography: '',
    profilePicUrl: '',
    followersCount: 0,
    followsCount: 0,
    postsCount: 0,
    isVerified: false,
    isBusinessAccount: false,
  } : null

  return { profile: ownerData, reels }
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

// Scrape reels for a competitor (public, no session needed)
export async function scrapeCompetitorReels(username: string, limit = 20): Promise<ApifyReel[]> {
  const run = await client.actor('apify/instagram-scraper').call({
    directUrls: [`https://www.instagram.com/${username}/`],
    resultsType: 'posts',
    resultsLimit: limit,
  }, { waitSecs: 120 })

  const { items } = await client.dataset(run.defaultDatasetId).listItems()

  return (items as any[])
    .filter(item => item.type === 'Video' || item.videoViewCount > 0)
    .map(item => ({
      id: item.id || item.shortCode,
      shortCode: item.shortCode,
      url: item.url || `https://www.instagram.com/reel/${item.shortCode}/`,
      displayUrl: item.displayUrl || '',
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
}
