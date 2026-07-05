-- Run this in your Supabase SQL editor

create extension if not exists "uuid-ossp";

-- Instagram accounts
create table if not exists ig_accounts (
  id uuid primary key default uuid_generate_v4(),
  ig_user_id text unique not null,
  username text not null,
  name text,
  profile_picture_url text,
  followers_count integer default 0,
  media_count integer default 0,
  access_token text not null,
  token_expires_at timestamptz,
  data_source text default 'apify',
  apify_session_cookie text,
  user_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);

-- Reels
create table if not exists reels (
  id uuid primary key default uuid_generate_v4(),
  account_id uuid references ig_accounts(id) on delete cascade,
  ig_media_id text not null,
  media_type text not null,
  is_trial boolean default false,
  caption text,
  thumbnail_url text,
  permalink text not null,
  timestamp timestamptz not null,
  views integer default 0,
  likes integer default 0,
  comments integer default 0,
  shares integer default 0,
  saves integer default 0,
  reach integer default 0,
  like_rate numeric(6,3) default 0,
  save_rate numeric(6,3) default 0,
  comment_rate numeric(6,3) default 0,
  share_rate numeric(6,3) default 0,
  multiplier numeric(6,3) default 1,
  organic_percentage integer default 100,
  ads_percentage integer default 0,
  words_per_minute integer,
  transcript text,
  hook text,
  cta text,
  structure jsonb,
  ai_analysis text,
  frames_analyzed boolean default false,
  duration_seconds integer,
  synced_at timestamptz,
  created_at timestamptz default now(),
  unique(account_id, ig_media_id)
);

-- Stories
create table if not exists stories (
  id uuid primary key default uuid_generate_v4(),
  account_id uuid references ig_accounts(id) on delete cascade,
  ig_media_id text not null,
  media_type text not null,
  media_url text,
  timestamp timestamptz not null,
  impressions integer default 0,
  reach integer default 0,
  replies integer default 0,
  exits integer default 0,
  taps_forward integer default 0,
  taps_back integer default 0,
  dropoff_percentage numeric(5,2),
  ai_analysis text,
  created_at timestamptz default now(),
  unique(account_id, ig_media_id)
);

-- Competitors
create table if not exists competitors (
  id uuid primary key default uuid_generate_v4(),
  account_id uuid references ig_accounts(id) on delete cascade,
  ig_username text not null,
  ig_user_id text,
  name text,
  profile_picture_url text,
  followers_count integer,
  last_synced_at timestamptz,
  created_at timestamptz default now(),
  unique(account_id, ig_username)
);

-- Competitor reels
create table if not exists competitor_reels (
  id uuid primary key default uuid_generate_v4(),
  competitor_id uuid references competitors(id) on delete cascade,
  ig_media_id text not null,
  is_trial boolean default false,
  caption text,
  thumbnail_url text,
  permalink text,
  timestamp timestamptz,
  views integer,
  likes integer,
  comments integer,
  shares integer,
  transcript text,
  hook text,
  ai_analysis text,
  created_at timestamptz default now(),
  unique(competitor_id, ig_media_id)
);

-- Sales
create table if not exists sales (
  id uuid primary key default uuid_generate_v4(),
  account_id uuid references ig_accounts(id) on delete cascade,
  amount numeric(12,2) not null,
  installments integer default 1,
  amount_per_installment numeric(12,2),
  cash_collected numeric(12,2) default 0,
  pending_amount numeric(12,2) default 0,
  closed_at date not null,
  reel_id uuid references reels(id) on delete set null,
  story_id uuid references stories(id) on delete set null,
  notes text,
  created_at timestamptz default now()
);

-- Content pipeline
create table if not exists content_pieces (
  id uuid primary key default uuid_generate_v4(),
  account_id uuid references ig_accounts(id) on delete cascade,
  title text not null,
  content_type text not null default 'reel',
  status text not null default 'idea',
  target_publish_date date,
  platform text default 'instagram',
  script text,
  raw_video_url text,
  edited_video_url text,
  reference_video_url text,
  reel_id uuid references reels(id) on delete set null,
  position integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Audience stats (daily)
create table if not exists audience_stats (
  id uuid primary key default uuid_generate_v4(),
  account_id uuid references ig_accounts(id) on delete cascade,
  date date not null,
  reach integer default 0,
  impressions integer default 0,
  followers_count integer default 0,
  profile_views integer default 0,
  website_clicks integer default 0,
  created_at timestamptz default now(),
  unique(account_id, date)
);

-- Brand DNA
create table if not exists brand_dna (
  id uuid primary key default uuid_generate_v4(),
  account_id uuid references ig_accounts(id) on delete cascade unique,
  content text,
  fields jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Reference videos
create table if not exists reference_videos (
  id uuid primary key default uuid_generate_v4(),
  account_id uuid references ig_accounts(id) on delete cascade,
  filename text not null,
  file_path text,
  file_size bigint,
  referent_name text,
  duration_seconds integer,
  transcript text,
  word_count integer,
  hook text,
  structure jsonb,
  adaptation text,
  last_adapted_angle text,
  status text default 'uploaded',
  error_message text,
  created_at timestamptz default now()
);

-- Indexes for performance
create index if not exists reels_account_id_idx on reels(account_id);
create index if not exists reels_timestamp_idx on reels(timestamp desc);
create index if not exists reels_multiplier_idx on reels(account_id, multiplier desc);
create index if not exists stories_account_id_idx on stories(account_id);
create index if not exists competitor_reels_competitor_id_idx on competitor_reels(competitor_id);
create index if not exists sales_account_id_idx on sales(account_id);
create index if not exists content_pieces_account_status_idx on content_pieces(account_id, status);
