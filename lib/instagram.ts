const IG_API = 'https://graph.instagram.com/v21.0'
const GRAPH_API = 'https://graph.facebook.com/v21.0'

export async function getIGUserProfile(accessToken: string) {
  const res = await fetch(
    `${IG_API}/me?fields=id,username,name,profile_picture_url,followers_count,media_count&access_token=${accessToken}`
  )
  return res.json()
}

export async function getReels(igUserId: string, accessToken: string, after?: string) {
  const fields = 'id,media_type,caption,thumbnail_url,permalink,timestamp,is_shared_to_feed'
  const limit = 50
  const cursorParam = after ? `&after=${after}` : ''
  const res = await fetch(
    `${IG_API}/${igUserId}/media?fields=${fields}&limit=${limit}${cursorParam}&access_token=${accessToken}`
  )
  return res.json()
}

export async function getReelInsights(mediaId: string, accessToken: string) {
  const metrics = 'views,likes,comments,shares,saved,reach,plays,ig_reels_video_view_total_time'
  const res = await fetch(
    `${IG_API}/${mediaId}/insights?metric=${metrics}&access_token=${accessToken}`
  )
  const data = await res.json()
  if (data.error) return null

  const result: Record<string, number> = {}
  for (const item of data.data || []) {
    result[item.name] = item.values?.[0]?.value ?? item.value ?? 0
  }
  return result
}

export async function getStories(igUserId: string, accessToken: string) {
  const fields = 'id,media_type,media_url,timestamp'
  const res = await fetch(
    `${IG_API}/${igUserId}/stories?fields=${fields}&access_token=${accessToken}`
  )
  return res.json()
}

export async function getStoryInsights(mediaId: string, accessToken: string) {
  const metrics = 'impressions,reach,replies,exits,taps_forward,taps_back'
  const res = await fetch(
    `${IG_API}/${mediaId}/insights?metric=${metrics}&access_token=${accessToken}`
  )
  const data = await res.json()
  if (data.error) return null

  const result: Record<string, number> = {}
  for (const item of data.data || []) {
    result[item.name] = item.values?.[0]?.value ?? item.value ?? 0
  }
  return result
}

export async function getAudienceInsights(igUserId: string, accessToken: string, since: string, until: string) {
  const metrics = 'reach,impressions,profile_views,follower_count,website_clicks'
  const res = await fetch(
    `${IG_API}/${igUserId}/insights?metric=${metrics}&period=day&since=${since}&until=${until}&access_token=${accessToken}`
  )
  return res.json()
}

export async function getPublicMediaByUsername(username: string, accessToken: string) {
  // Search via oEmbed or public discovery
  const res = await fetch(
    `${GRAPH_API}/ig_hashtag_search?user_id=me&q=${username}&access_token=${accessToken}`
  )
  return res.json()
}

export function getOAuthUrl(redirectUri: string) {
  const appId = process.env.NEXT_PUBLIC_META_APP_ID
  const scopes = [
    'instagram_basic',
    'instagram_content_publish',
    'instagram_manage_insights',
    'instagram_manage_comments',
    'pages_read_engagement',
    'pages_show_list',
  ].join(',')

  return `https://www.facebook.com/v21.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes}&response_type=code`
}

export async function exchangeCodeForToken(code: string, redirectUri: string) {
  const res = await fetch(`${GRAPH_API}/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.META_APP_ID,
      client_secret: process.env.META_APP_SECRET,
      redirect_uri: redirectUri,
      code,
    }),
  })
  return res.json()
}

export async function getLongLivedToken(shortToken: string) {
  const res = await fetch(
    `${GRAPH_API}/oauth/access_token?grant_type=fb_exchange_token&client_id=${process.env.META_APP_ID}&client_secret=${process.env.META_APP_SECRET}&fb_exchange_token=${shortToken}`
  )
  return res.json()
}

export async function getIGAccountFromPage(pageAccessToken: string, pageId: string) {
  const res = await fetch(
    `${GRAPH_API}/${pageId}/instagram_accounts?fields=id,username,name,profile_picture_url,followers_count&access_token=${pageAccessToken}`
  )
  return res.json()
}

export async function getUserPages(accessToken: string) {
  const res = await fetch(
    `${GRAPH_API}/me/accounts?access_token=${accessToken}`
  )
  return res.json()
}
