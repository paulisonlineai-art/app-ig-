-- =============================================================================
-- Migration: Apify scraper → Instagram Graph API
-- Run this in your Supabase SQL editor BEFORE deploying the new code.
--
-- WARNING: Existing connected accounts will need to re-authenticate via
-- Meta OAuth after this migration. There is no automated migration path
-- for Apify-based accounts.
-- =============================================================================

-- 1. Add new Graph API columns
ALTER TABLE ig_accounts
  ADD COLUMN IF NOT EXISTS ig_access_token        TEXT,
  ADD COLUMN IF NOT EXISTS ig_token_expires_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ig_user_id_numeric     BIGINT,
  ADD COLUMN IF NOT EXISTS ig_account_type        TEXT CHECK (ig_account_type IN ('BUSINESS', 'CREATOR', 'PERSONAL'));

-- 2. Rename access_token → legacy_access_token (preserve existing data)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ig_accounts' AND column_name = 'access_token'
  ) THEN
    ALTER TABLE ig_accounts RENAME COLUMN access_token TO legacy_access_token;
  END IF;
END $$;

-- 3. Drop legacy Apify columns
--    These are dropped AFTER renaming so no data is lost for any rollback window.
ALTER TABLE ig_accounts
  DROP COLUMN IF EXISTS data_source,
  DROP COLUMN IF EXISTS apify_session_cookie;

-- 4. Index for token expiry queries (used by cron to skip expired accounts)
CREATE INDEX IF NOT EXISTS ig_accounts_token_expires_idx
  ON ig_accounts (ig_token_expires_at);

-- 5. Index for numeric IG user ID (used by Business Discovery API)
CREATE INDEX IF NOT EXISTS ig_accounts_user_id_numeric_idx
  ON ig_accounts (ig_user_id_numeric);

-- Done. Verify with:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'ig_accounts';
