-- Prayer times read from masjid websites by the masjid-times Edge Function, kept for a day so
-- each masjid's site is read at most once a day. Only the Edge Function (service role) uses it.
create table masjid_times (
  osm_id text primary key,       -- OpenStreetMap id, e.g. 'way/123'
  website text not null,
  for_date date not null,        -- the day the times were read for
  result jsonb not null,         -- { found, iqamah: {fajr..isha}, jumuah: [], source, note }
  fetched_by uuid references auth.users(id) on delete set null,
  fetched_at timestamptz not null default now()
);

create index masjid_times_fetched_by on masjid_times (fetched_by, fetched_at);

alter table masjid_times enable row level security;
-- No policies: the app never reads this table directly.
