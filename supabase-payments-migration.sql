-- Run this in your Supabase SQL editor

-- Per-account payment integration config (each Moka account has its own
-- Stripe/Hotmart/Skool credentials, same pattern as apify_session_cookie)
alter table ig_accounts add column if not exists stripe_webhook_secret text;
alter table ig_accounts add column if not exists hotmart_hottok text;
alter table ig_accounts add column if not exists skool_webhook_secret text;
alter table ig_accounts add column if not exists stripe_payment_link_base text;
alter table ig_accounts add column if not exists hotmart_checkout_url_base text;
alter table ig_accounts add column if not exists skool_fixed_price numeric(12,2);

-- Short tracking code per reel, used as the attribution param in checkout links
alter table reels add column if not exists tracking_code text unique;

-- Sale origin + idempotency for webhook-driven inserts
alter table sales add column if not exists source text default 'manual';
alter table sales add column if not exists external_id text;

create unique index if not exists sales_source_external_id_idx
  on sales(account_id, source, external_id)
  where source <> 'manual';
