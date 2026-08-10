-- =============================================================================
-- Migration: Add reach + total_interactions columns to reels
-- Run this in your Supabase SQL editor before deploying the insights sync.
-- =============================================================================

ALTER TABLE reels
  ADD COLUMN IF NOT EXISTS reach              INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_interactions INTEGER NOT NULL DEFAULT 0;

-- Done. Verify with:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'reels';
