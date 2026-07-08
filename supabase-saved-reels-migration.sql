-- Run this in your Supabase SQL editor

alter table competitor_reels add column if not exists saved boolean default false;
create index if not exists competitor_reels_saved_idx on competitor_reels(competitor_id, saved) where saved = true;
