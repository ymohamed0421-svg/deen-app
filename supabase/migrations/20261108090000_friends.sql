-- Friends and streak buddies.
-- People sign in as anonymous guests, so friends find each other with a short friend code
-- (or an invite link that carries it). Being friends is mutual: adding a code links both people.
-- Friends can see each other's name, streak, whether they studied today and how many of the
-- five prayers they've marked, and send a gentle nudge once a day.
-- Every write goes through the functions below (security definer), never straight to the tables.

-- ---------- tables ----------

alter table profiles add column if not exists friend_code text unique;
alter table profiles add constraint display_name_length check (display_name is null or char_length(display_name) between 1 and 30);

create table friends (
  user_id uuid not null references auth.users(id) on delete cascade,
  friend_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, friend_id),
  check (user_id <> friend_id)
);
create index friends_friend_id on friends (friend_id);

-- What the user shares with friends about their day. One row per user, for their latest day.
create table friend_status (
  user_id uuid primary key references auth.users(id) on delete cascade,
  day date not null,                   -- the user's own local date
  timezone text not null default 'UTC',
  studied boolean not null default false,
  prayers smallint check (prayers between 0 and 5), -- null until they use the prayer tracker
  streak int not null default 0 check (streak >= 0),
  updated_at timestamptz not null default now()
);

create table nudges (
  id bigint generated always as identity primary key,
  from_id uuid not null references auth.users(id) on delete cascade,
  to_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('pray', 'study')),
  day date not null, -- the friend's local date, so it's one nudge of each kind per friend per day
  created_at timestamptz not null default now(),
  seen_at timestamptz,
  unique (from_id, to_id, kind, day)
);
create index nudges_inbox on nudges (to_id, seen_at);

alter table friends enable row level security;
alter table friend_status enable row level security;
alter table nudges enable row level security;
create policy "see your friends" on friends for select using (auth.uid() = user_id);
create policy "read own status" on friend_status for select using (auth.uid() = user_id);
create policy "see nudges sent to you" on nudges for select using (auth.uid() = to_id);
-- No insert, update or delete policies: the functions below do all the writing.

-- ---------- helpers ----------

/** Today's date in a time zone, falling back to UTC for an unknown zone name. */
create function public.local_today(tz text) returns date
language plpgsql stable as $$
begin
  return (now() at time zone coalesce(tz, 'UTC'))::date;
exception when others then
  return (now() at time zone 'UTC')::date;
end;
$$;

/** The user's friend code, made the first time it's asked for. No 0/O or 1/I, so it's easy to read out. */
create function public.my_friend_code() returns text
language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  code text;
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
begin
  if me is null then raise exception 'not signed in'; end if;
  select friend_code into code from profiles where id = me;
  if code is not null then return code; end if;
  insert into profiles (id) values (me) on conflict (id) do nothing;
  loop
    code := '';
    for i in 1..6 loop
      code := code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    begin
      update profiles set friend_code = code where id = me;
      return code;
    exception when unique_violation then
      -- Someone already has this code. Try another.
    end;
  end loop;
end;
$$;

/** Adds the owner of a friend code as a friend, both ways. Returns their name. */
create function public.add_friend(p_code text) returns text
language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  other uuid;
  other_name text;
begin
  if me is null then raise exception 'not signed in'; end if;
  select id, display_name into other, other_name from profiles
    where friend_code = upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'));
  if other is null then raise exception 'No one has that friend code' using errcode = 'P0002'; end if;
  if other = me then raise exception 'That''s your own friend code' using errcode = '22023'; end if;
  if (select count(*) from friends where user_id = me) >= 100 then
    raise exception 'You can have up to 100 friends' using errcode = '54000';
  end if;
  insert into friends (user_id, friend_id) values (me, other), (other, me) on conflict do nothing;
  return coalesce(other_name, 'Your friend');
end;
$$;

create function public.remove_friend(p_friend uuid) returns void
language sql security definer set search_path = public as $$
  delete from friends
  where (user_id = auth.uid() and friend_id = p_friend) or (user_id = p_friend and friend_id = auth.uid());
$$;

/**
 * Shares the user's day with their friends. Pass null to leave a field as it is.
 * A new day starts fresh: studied goes back to false and prayers to unknown.
 */
create function public.share_status(p_day date, p_timezone text, p_studied boolean, p_prayers int, p_streak int)
returns void
language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  -- greatest() and least() skip nulls, so clamp only real values and keep null as "unchanged".
  v_prayers smallint := case when p_prayers is null then null else least(greatest(p_prayers, 0), 5) end;
  v_streak int := case when p_streak is null then null else greatest(p_streak, 0) end;
begin
  if me is null then raise exception 'not signed in'; end if;
  if p_day is null or abs(p_day - (now() at time zone 'UTC')::date) > 1 then
    raise exception 'bad day' using errcode = '22023';
  end if;
  insert into friend_status as s (user_id, day, timezone, studied, prayers, streak)
  values (me, p_day, coalesce(p_timezone, 'UTC'), coalesce(p_studied, false), v_prayers, coalesce(v_streak, 0))
  on conflict (user_id) do update set
    timezone = coalesce(p_timezone, s.timezone),
    studied = case when p_day > s.day then coalesce(p_studied, false)
                   when p_day = s.day then coalesce(p_studied, s.studied)
                   else s.studied end,
    prayers = case when p_day > s.day then v_prayers
                   when p_day = s.day then coalesce(v_prayers, s.prayers)
                   else s.prayers end,
    streak = case when p_day >= s.day then coalesce(v_streak, s.streak) else s.streak end,
    day = greatest(p_day, s.day),
    updated_at = now();
end;
$$;

/** Same as share_status with only the prayer count, for the prayer tracker. */
create function public.report_prayers(p_day date, p_count int) returns void
language sql security definer set search_path = public as $$
  select public.share_status(p_day, null, null, p_count, null);
$$;

/**
 * Buddy streak: the days in a row that both friends studied. Kept in companion_streaks.
 * Runs when someone's studied flag turns on for a day, and counts every friend who already
 * studied on that same date.
 */
create function public.bump_buddy_streaks() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  f record;
  a uuid;
  b uuid;
begin
  if not new.studied or (tg_op = 'UPDATE' and old.studied and old.day = new.day) then
    return new;
  end if;
  for f in
    select s.user_id from friends fr
    join friend_status s on s.user_id = fr.friend_id
    where fr.user_id = new.user_id and s.studied and s.day = new.day
  loop
    a := least(new.user_id, f.user_id);
    b := greatest(new.user_id, f.user_id);
    insert into companion_streaks as c (user_a, user_b, current, last_both_active_date)
    values (a, b, 1, new.day)
    on conflict (user_a, user_b) do update set
      current = case
        when c.last_both_active_date = new.day then c.current
        when c.last_both_active_date = new.day - 1 then c.current + 1
        else 1 end,
      last_both_active_date = greatest(c.last_both_active_date, new.day);
  end loop;
  return new;
end;
$$;

create trigger friend_status_buddy_streaks
  after insert or update on friend_status
  for each row execute function public.bump_buddy_streaks();

/** The user's friends with today's status, for the Friends screen. Only friends are ever returned. */
create function public.my_friends()
returns table (
  friend_id uuid,
  name text,
  streak int,
  studied_today boolean,
  prayers_today int,
  buddy_streak int,
  nudged_pray boolean,
  nudged_study boolean
)
language sql stable security definer set search_path = public as $$
  with mine as (
    select fr.friend_id, fr.created_at, p.display_name, s.day, s.studied, s.prayers, s.streak,
           public.local_today(coalesce(s.timezone, p.timezone)) as their_today
    from friends fr
    join profiles p on p.id = fr.friend_id
    left join friend_status s on s.user_id = fr.friend_id
    where fr.user_id = auth.uid()
  )
  select
    m.friend_id,
    coalesce(m.display_name, 'Friend'),
    case when m.day >= m.their_today - 1 then m.streak else 0 end,
    coalesce(m.day = m.their_today and m.studied, false),
    case when m.day = m.their_today then m.prayers::int else null end,
    coalesce((
      select case when c.last_both_active_date >= least(m.their_today, (select public.local_today(timezone) from profiles where id = auth.uid())) - 1
                  then c.current else 0 end
      from companion_streaks c
      where c.user_a = least(auth.uid(), m.friend_id) and c.user_b = greatest(auth.uid(), m.friend_id)
    ), 0),
    exists (select 1 from nudges n where n.from_id = auth.uid() and n.to_id = m.friend_id and n.kind = 'pray' and n.day = m.their_today),
    exists (select 1 from nudges n where n.from_id = auth.uid() and n.to_id = m.friend_id and n.kind = 'study' and n.day = m.their_today)
  from mine m
  order by m.created_at;
$$;

/** Sends a friend a nudge. One of each kind per friend per day. Returns false if already sent today. */
create function public.send_nudge(p_friend uuid, p_kind text) returns boolean
language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  their_day date;
  inserted int;
begin
  if me is null then raise exception 'not signed in'; end if;
  if p_kind not in ('pray', 'study') then raise exception 'bad kind' using errcode = '22023'; end if;
  if not exists (select 1 from friends where user_id = me and friend_id = p_friend) then
    raise exception 'not your friend' using errcode = '42501';
  end if;
  select public.local_today(coalesce(s.timezone, p.timezone)) into their_day
    from profiles p left join friend_status s on s.user_id = p.id where p.id = p_friend;
  insert into nudges (from_id, to_id, kind, day) values (me, p_friend, p_kind, their_day)
    on conflict do nothing;
  get diagnostics inserted = row_count;
  return inserted > 0;
end;
$$;

/** Nudges the user hasn't seen yet, newest first, with who sent them. Marks them seen. */
create function public.take_nudges()
returns table (id bigint, from_name text, kind text, created_at timestamptz)
language plpgsql security definer set search_path = public as $$
begin
  return query
    with taken as (
      update nudges n set seen_at = now()
      where n.to_id = auth.uid() and n.seen_at is null and n.created_at > now() - interval '2 days'
      returning n.id, n.from_id, n.kind, n.created_at
    )
    select t.id, coalesce(p.display_name, 'A friend'), t.kind, t.created_at
    from taken t left join profiles p on p.id = t.from_id
    order by t.created_at desc;
end;
$$;

-- Signed-in people (anonymous guests included) can call these. Nobody else.
revoke execute on function public.my_friend_code(), public.add_friend(text), public.remove_friend(uuid),
  public.share_status(date, text, boolean, int, int), public.report_prayers(date, int), public.my_friends(),
  public.send_nudge(uuid, text), public.take_nudges() from public, anon;
grant execute on function public.my_friend_code(), public.add_friend(text), public.remove_friend(uuid),
  public.share_status(date, text, boolean, int, int), public.report_prayers(date, int), public.my_friends(),
  public.send_nudge(uuid, text), public.take_nudges() to authenticated;
revoke execute on function public.bump_buddy_streaks() from public, anon, authenticated;
