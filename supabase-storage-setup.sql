-- Run this in your Supabase SQL editor (SQL Editor → New query → paste → Run).
--
-- Creates the private storage bucket used by app/api/referencias/upload and
-- app/api/referencias/transcribe. Reference videos used to be written to
-- /tmp on the server, which doesn't work on Vercel (ephemeral, not shared
-- across requests) — they're now uploaded straight from the browser to this
-- bucket via a signed URL, and downloaded server-side for transcription.

insert into storage.buckets (id, name, public, file_size_limit)
values ('reference-videos', 'reference-videos', false, 209715200) -- 200MB
on conflict (id) do nothing;

-- The app only ever accesses this bucket via the service role key (which
-- bypasses storage RLS same as it does for regular tables), so these
-- policies are defense-in-depth against the public anon key, not something
-- the app itself depends on.
create policy "own reference videos storage" on storage.objects
  for all
  using (bucket_id = 'reference-videos' and (storage.foldername(name))[1] = (
    select id::text from ig_accounts where user_id = auth.uid()
  ))
  with check (bucket_id = 'reference-videos' and (storage.foldername(name))[1] = (
    select id::text from ig_accounts where user_id = auth.uid()
  ));
