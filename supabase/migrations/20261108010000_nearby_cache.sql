-- Masjid searches from the nearby-masjids Edge Function, saved per ~1 km area for a week so the
-- free TomTom allowance goes a long way. Only the Edge Function (service role) uses it.
create table nearby_cache (
  area text primary key,          -- '38.79,-77.27'
  result jsonb not null,          -- list of masjids
  fetched_by uuid references auth.users(id) on delete set null,
  fetched_at timestamptz not null default now()
);

create index nearby_cache_fetched_by on nearby_cache (fetched_by, fetched_at);

alter table nearby_cache enable row level security;
-- No policies: the app never reads this table directly.
