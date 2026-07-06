-- Run this in your Supabase SQL editor (SQL Editor → New query → paste → Run).
--
-- Adds the columns needed for the new competitor reel detail page: adapting
-- a competitor's reel to your own niche, optionally after transcribing its
-- audio (the "PRO" tier — costs a Whisper call, vs. the free caption-only
-- adaptation).

alter table competitor_reels add column if not exists video_url text;
alter table competitor_reels add column if not exists structure jsonb;
alter table competitor_reels add column if not exists adaptation text;
alter table competitor_reels add column if not exists last_adapted_angle text;
alter table competitor_reels add column if not exists word_count integer;
alter table competitor_reels add column if not exists transcribe_status text default 'none';
alter table competitor_reels add column if not exists error_message text;
