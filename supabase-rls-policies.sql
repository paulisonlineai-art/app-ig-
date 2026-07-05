-- Run this in your Supabase SQL editor (SQL Editor → New query → paste → Run).
--
-- Why: none of the tables in supabase-schema.sql have Row-Level Security
-- enabled. The app's own server code always uses the SERVICE ROLE key
-- (see lib/supabase.ts), which bypasses RLS entirely — so none of this
-- changes how the app behaves. What it fixes: your NEXT_PUBLIC_SUPABASE_ANON_KEY
-- is public (shipped in the browser bundle by design), and without RLS,
-- anyone who has it can read or write every row in every table directly via
-- Supabase's auto-generated REST API, completely bypassing your app,
-- your login, and the ig_account_id cookie. This locks that down so the
-- anon key alone can only ever see rows owned by the logged-in user.
--
-- Safe to run any time — this only affects access via the anon/authenticated
-- key. Your app's service-role queries are unaffected.

alter table ig_accounts enable row level security;
alter table reels enable row level security;
alter table stories enable row level security;
alter table competitors enable row level security;
alter table competitor_reels enable row level security;
alter table sales enable row level security;
alter table content_pieces enable row level security;
alter table audience_stats enable row level security;
alter table brand_dna enable row level security;
alter table reference_videos enable row level security;

-- ig_accounts: a user can only see/touch their own connected account.
create policy "own account" on ig_accounts
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Tables with a direct account_id column: ownership is "this account_id
-- belongs to an ig_accounts row owned by the current user".
create policy "own reels" on reels
  for all
  using (account_id in (select id from ig_accounts where user_id = auth.uid()))
  with check (account_id in (select id from ig_accounts where user_id = auth.uid()));

create policy "own stories" on stories
  for all
  using (account_id in (select id from ig_accounts where user_id = auth.uid()))
  with check (account_id in (select id from ig_accounts where user_id = auth.uid()));

create policy "own competitors" on competitors
  for all
  using (account_id in (select id from ig_accounts where user_id = auth.uid()))
  with check (account_id in (select id from ig_accounts where user_id = auth.uid()));

create policy "own sales" on sales
  for all
  using (account_id in (select id from ig_accounts where user_id = auth.uid()))
  with check (account_id in (select id from ig_accounts where user_id = auth.uid()));

create policy "own content pieces" on content_pieces
  for all
  using (account_id in (select id from ig_accounts where user_id = auth.uid()))
  with check (account_id in (select id from ig_accounts where user_id = auth.uid()));

create policy "own audience stats" on audience_stats
  for all
  using (account_id in (select id from ig_accounts where user_id = auth.uid()))
  with check (account_id in (select id from ig_accounts where user_id = auth.uid()));

create policy "own brand dna" on brand_dna
  for all
  using (account_id in (select id from ig_accounts where user_id = auth.uid()))
  with check (account_id in (select id from ig_accounts where user_id = auth.uid()));

create policy "own reference videos" on reference_videos
  for all
  using (account_id in (select id from ig_accounts where user_id = auth.uid()))
  with check (account_id in (select id from ig_accounts where user_id = auth.uid()));

-- competitor_reels has no account_id column directly — ownership goes
-- through competitors.account_id.
create policy "own competitor reels" on competitor_reels
  for all
  using (
    competitor_id in (
      select c.id from competitors c
      join ig_accounts a on a.id = c.account_id
      where a.user_id = auth.uid()
    )
  )
  with check (
    competitor_id in (
      select c.id from competitors c
      join ig_accounts a on a.id = c.account_id
      where a.user_id = auth.uid()
    )
  );
