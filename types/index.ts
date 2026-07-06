export interface IGAccount {
  id: string
  user_id: string
  ig_user_id: string
  username: string
  name: string
  profile_picture_url: string
  followers_count: number
  media_count: number
  access_token: string
  token_expires_at: string
  data_source: string
  apify_session_cookie: string | null
  stripe_webhook_secret: string | null
  hotmart_hottok: string | null
  skool_webhook_secret: string | null
  stripe_payment_link_base: string | null
  hotmart_checkout_url_base: string | null
  skool_fixed_price: number | null
  created_at: string
}

export interface Reel {
  id: string
  account_id: string
  ig_media_id: string
  media_type: 'REELS' | 'VIDEO'
  is_trial: boolean
  caption: string | null
  thumbnail_url: string | null
  permalink: string
  timestamp: string
  // Metrics
  views: number
  likes: number
  comments: number
  shares: number
  saves: number
  reach: number
  // Computed rates (per 100 views)
  like_rate: number
  save_rate: number
  comment_rate: number
  share_rate: number
  // Multiplier vs account average
  multiplier: number
  organic_percentage: number
  ads_percentage: number
  // Words per minute from transcript
  words_per_minute: number | null
  // AI analysis
  transcript: string | null
  hook: string | null
  cta: string | null
  structure: ReelStructure | null
  ai_analysis: string | null
  frames_analyzed: boolean
  duration_seconds: number | null
  tracking_code: string | null
  synced_at: string
  created_at: string
}

export interface ReelStructure {
  hook: string
  promise: string
  development: string
  cta: string
  narrative_type: string
  desire_appealed: string
  cta_type: string
}

export interface Story {
  id: string
  account_id: string
  ig_media_id: string
  media_type: 'IMAGE' | 'VIDEO'
  media_url: string | null
  timestamp: string
  // Metrics
  impressions: number
  reach: number
  replies: number
  exits: number
  taps_forward: number
  taps_back: number
  // Drop off vs previous story
  dropoff_percentage: number | null
  ai_analysis: string | null
  created_at: string
}

export interface Competitor {
  id: string
  account_id: string
  ig_username: string
  ig_user_id: string | null
  name: string | null
  profile_picture_url: string | null
  followers_count: number | null
  last_synced_at: string | null
  created_at: string
}

export interface CompetitorReel {
  id: string
  competitor_id: string
  ig_media_id: string
  is_trial: boolean
  caption: string | null
  thumbnail_url: string | null
  video_url: string | null
  permalink: string
  timestamp: string
  views: number | null
  likes: number | null
  comments: number | null
  shares: number | null
  transcript: string | null
  word_count: number | null
  hook: string | null
  structure: ReelStructure | null
  adaptation: string | null
  last_adapted_angle: string | null
  transcribe_status: 'none' | 'transcribing' | 'transcribed' | 'error'
  error_message: string | null
  ai_analysis: string | null
  created_at: string
}

export interface Sale {
  id: string
  account_id: string
  amount: number
  installments: number
  amount_per_installment: number
  cash_collected: number
  pending_amount: number
  closed_at: string
  reel_id: string | null
  story_id: string | null
  notes: string | null
  source: 'manual' | 'stripe' | 'hotmart' | 'skool'
  external_id: string | null
  created_at: string
}

export interface ContentPiece {
  id: string
  account_id: string
  title: string
  content_type: 'reel' | 'story' | 'post' | 'trial_reel'
  status: 'idea' | 'ready_to_record' | 'raw_recorded' | 'editing' | 'ready_to_publish' | 'published'
  target_publish_date: string | null
  platform: string
  script: string | null
  raw_video_url: string | null
  edited_video_url: string | null
  reference_video_url: string | null
  reel_id: string | null
  position: number
  created_at: string
  updated_at: string
}

export interface DashboardStats {
  views_30d: number
  views_30d_prev: number
  conversations_30d: number
  conversations_30d_prev: number
  revenue_30d: number
  story_replies_30d: number
  comments_30d: number
  followers: number
  top_reels: Reel[]
}

export interface AudienceStats {
  date: string
  reach: number
  impressions: number
  followers_count: number
  profile_views: number
  website_clicks: number
}
