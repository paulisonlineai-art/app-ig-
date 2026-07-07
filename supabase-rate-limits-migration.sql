-- Run this in your Supabase SQL editor

create table if not exists rate_limits (
  account_id uuid references ig_accounts(id) on delete cascade,
  action text not null,
  last_called_at timestamptz not null default now(),
  primary key (account_id, action)
);
