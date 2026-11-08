-- Prayer times that app users typed in to fix a masjid's schedule. Shown to everyone in place of
-- what was read off the website. Only the masjid-times Edge Function (service role) uses it.
create table masjid_corrections (
  osm_id text primary key,       -- same ids as masjid_times: 'way/123', 'tt/abc', 'site/slug'
  name text not null,
  times jsonb not null,          -- { iqamah: {fajr..isha}, jumuah: [] }
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

create index masjid_corrections_updated_by on masjid_corrections (updated_by, updated_at);

alter table masjid_corrections enable row level security;
-- No policies: the app never reads this table directly.
