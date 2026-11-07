-- Deen app: initial schema.
-- Content tables are readable by everyone (only approved lessons) and written by admins.
-- Progress tables belong to one user each and are protected by row level security.
-- Rewards, streaks and wallets are written only by the complete-lesson Edge Function (service role).

-- ---------- content ----------

create type review_status as enum ('draft', 'in_review', 'approved');

create table levels (
  id text primary key,
  title text not null,
  sort int not null
);

create table units (
  id text primary key,
  level_id text references levels(id),
  title text not null,
  subtitle text,
  color text,
  foundation boolean not null default false,
  sort int not null
);

create table lessons (
  id text primary key,
  unit_id text not null references units(id) on delete cascade,
  title text not null,
  teach text not null,
  sort int not null,
  review_status review_status not null default 'draft',
  reviewed_by text,
  reviewed_at timestamptz
);

create table exercises (
  id bigint generated always as identity primary key,
  lesson_id text not null references lessons(id) on delete cascade,
  type text not null check (type in ('choice', 'order', 'match')),
  body jsonb not null, -- prompt, options/items/pairs, answer, explain
  sort int not null
);

create table sources (
  id bigint generated always as identity primary key,
  kind text not null check (kind in ('quran', 'hadith', 'book')),
  reference text not null, -- e.g. 'Sahih al-Bukhari 8'
  grade text,              -- for hadith: sahih, hasan
  text_ar text,
  text_en text
);

create table exercise_sources (
  exercise_id bigint references exercises(id) on delete cascade,
  source_id bigint references sources(id) on delete cascade,
  primary key (exercise_id, source_id)
);

-- ---------- users ----------

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  timezone text not null default 'UTC',
  daily_goal int not null default 1 check (daily_goal between 1 and 3),
  madhab text check (madhab in ('hanafi', 'maliki', 'shafii', 'hanbali')),
  reminder_time time,
  noor int not null default 0,
  created_at timestamptz not null default now()
);

create table streaks (
  user_id uuid primary key references auth.users(id) on delete cascade,
  current int not null default 0,
  longest int not null default 0,
  last_active_date date
);

create table wallets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  oil int not null default 5,
  oil_updated_at timestamptz not null default now(),
  pearls int not null default 0,
  mercy_days int not null default 0
);

create table lesson_progress (
  user_id uuid references auth.users(id) on delete cascade,
  lesson_id text references lessons(id) on delete cascade,
  best_mistakes int not null,
  completed_at timestamptz not null default now(),
  attempts int not null default 1,
  primary key (user_id, lesson_id)
);

create table points_ledger (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  noor int not null default 0,
  pearls int not null default 0,
  reason text not null,
  created_at timestamptz not null default now()
);

create table garden_items (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,
  lesson_id text,
  planted_at timestamptz not null default now()
);

-- ---------- leagues and friends ----------

create table leagues (
  id bigint generated always as identity primary key,
  tier text not null check (tier in ('Seed', 'Sprout', 'Sapling', 'Palm', 'Olive', 'Cedar')),
  week_start date not null
);

create table league_members (
  league_id bigint references leagues(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  weekly_noor int not null default 0,
  final_rank int,
  primary key (league_id, user_id)
);

create table follows (
  follower_id uuid references auth.users(id) on delete cascade,
  followee_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);

create table companion_streaks (
  user_a uuid references auth.users(id) on delete cascade,
  user_b uuid references auth.users(id) on delete cascade,
  current int not null default 0,
  last_both_active_date date,
  primary key (user_a, user_b),
  check (user_a < user_b)
);

create table circles (
  id bigint generated always as identity primary key,
  name text not null,
  weekly_goal int not null default 20,
  created_by uuid references auth.users(id) on delete set null
);

create table circle_members (
  circle_id bigint references circles(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  primary key (circle_id, user_id)
);

-- ---------- row level security ----------

alter table levels enable row level security;
alter table units enable row level security;
alter table lessons enable row level security;
alter table exercises enable row level security;
alter table sources enable row level security;
alter table exercise_sources enable row level security;

create policy "content is public" on levels for select using (true);
create policy "content is public" on units for select using (true);
create policy "only approved lessons are public" on lessons for select using (review_status = 'approved');
create policy "exercises of approved lessons" on exercises for select
  using (exists (select 1 from lessons l where l.id = lesson_id and l.review_status = 'approved'));
create policy "content is public" on sources for select using (true);
create policy "content is public" on exercise_sources for select using (true);

alter table profiles enable row level security;
create policy "read own profile" on profiles for select using (auth.uid() = id);
create policy "update own profile" on profiles for update using (auth.uid() = id);
create policy "insert own profile" on profiles for insert with check (auth.uid() = id);

-- Progress is read-only for the user. Only the Edge Function (service role) writes it.
alter table streaks enable row level security;
alter table wallets enable row level security;
alter table lesson_progress enable row level security;
alter table points_ledger enable row level security;
alter table garden_items enable row level security;
create policy "read own" on streaks for select using (auth.uid() = user_id);
create policy "read own" on wallets for select using (auth.uid() = user_id);
create policy "read own" on lesson_progress for select using (auth.uid() = user_id);
create policy "read own" on points_ledger for select using (auth.uid() = user_id);
create policy "read own" on garden_items for select using (auth.uid() = user_id);

-- Helpers run as the table owner so membership policies don't recurse into themselves.
create function public.my_league_ids() returns setof bigint
language sql stable security definer set search_path = public as $$
  select league_id from league_members where user_id = auth.uid()
$$;

create function public.my_circle_ids() returns setof bigint
language sql stable security definer set search_path = public as $$
  select circle_id from circle_members where user_id = auth.uid()
$$;

alter table leagues enable row level security;
alter table league_members enable row level security;
create policy "leagues are visible" on leagues for select using (true);
create policy "see members of your league" on league_members for select
  using (league_id in (select public.my_league_ids()));

alter table follows enable row level security;
create policy "see your follows" on follows for select using (auth.uid() in (follower_id, followee_id));
create policy "follow someone" on follows for insert with check (auth.uid() = follower_id);
create policy "unfollow" on follows for delete using (auth.uid() = follower_id);

alter table companion_streaks enable row level security;
create policy "see your companion streaks" on companion_streaks for select using (auth.uid() in (user_a, user_b));

alter table circles enable row level security;
alter table circle_members enable row level security;
create policy "see circles you are in" on circles for select
  using (id in (select public.my_circle_ids()));
create policy "create a circle" on circles for insert with check (auth.uid() = created_by);
create policy "see members of your circles" on circle_members for select
  using (circle_id in (select public.my_circle_ids()));
create policy "join a circle" on circle_members for insert with check (auth.uid() = user_id);
create policy "leave a circle" on circle_members for delete using (auth.uid() = user_id);

-- Create the user's rows when they sign up (including anonymous sign-ins).
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id) values (new.id);
  insert into streaks (user_id) values (new.id);
  insert into wallets (user_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
