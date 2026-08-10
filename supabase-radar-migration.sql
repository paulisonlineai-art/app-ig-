-- Run this in your Supabase SQL editor.
-- Adds CTA categorization to competitor reels and a bio field to competitors,
-- for the "Radar de Competencia" ranking page.

alter table competitor_reels add column if not exists cta_type text default 'NONE';
create index if not exists competitor_reels_cta_type_idx on competitor_reels(cta_type);

alter table competitors add column if not exists bio text;
