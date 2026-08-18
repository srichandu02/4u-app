-- ============================================================
-- 4U App — Supabase schema
-- Run this in the Supabase SQL editor (Project → SQL Editor → New query)
-- ============================================================

-- Requires the pgcrypto extension for gen_random_uuid()
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- profiles
-- One row per user, linked 1:1 to Supabase's built-in auth.users
-- ------------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  age int check (age is null or age >= 18),
  city text,
  bio text,
  interests text[] not null default '{}',
  verified boolean not null default false,
  banned boolean not null default false,
  coins int not null default 240,
  streak int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- matchmaking queue
-- A row = a user currently waiting to be matched.
-- Deleted once matched, or expired by matched_at cleanup.
-- ------------------------------------------------------------
create table if not exists match_queue (
  user_id uuid primary key references profiles (id) on delete cascade,
  interests text[] not null default '{}',
  joined_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- matches
-- A confirmed pairing between two users (from the queue or a
-- future recommendation engine).
-- ------------------------------------------------------------
create table if not exists matches (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references profiles (id) on delete cascade,
  user_b uuid not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint different_users check (user_a <> user_b)
);

-- ------------------------------------------------------------
-- messages
-- Chat messages belong to a match.
-- ------------------------------------------------------------
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references matches (id) on delete cascade,
  sender_id uuid not null references profiles (id) on delete cascade,
  kind text not null default 'text', -- 'text' | 'gift' | 'call_log'
  body text not null,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- call_logs
-- One row per call attempt, referenced from a message of kind 'call_log'.
-- ------------------------------------------------------------
create table if not exists call_logs (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references matches (id) on delete cascade,
  caller_id uuid not null references profiles (id) on delete cascade,
  call_type text not null, -- 'audio' | 'video'
  status text not null,    -- 'completed' | 'no_answer' | 'declined'
  duration_seconds int not null default 0,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- rooms (live audio rooms)
-- ------------------------------------------------------------
create table if not exists rooms (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references profiles (id) on delete cascade,
  title text not null,
  tag text,
  is_live boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists room_participants (
  room_id uuid not null references rooms (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (room_id, user_id)
);

-- ------------------------------------------------------------
-- reports (safety / moderation)
-- ------------------------------------------------------------
create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references profiles (id) on delete cascade,
  reported_id uuid not null references profiles (id) on delete cascade,
  context text, -- e.g. 'chat', 'call', 'room'
  reason text,
  created_at timestamptz not null default now()
);

create table if not exists match_attempts (
  user_id uuid not null references profiles (id) on delete cascade,
  attempted_at timestamptz not null default now()
);

-- ============================================================
-- Row Level Security
-- Every table is locked down by default; policies below open
-- only the access each user actually needs.
-- ============================================================
alter table profiles enable row level security;
alter table match_queue enable row level security;
alter table matches enable row level security;
alter table messages enable row level security;
alter table call_logs enable row level security;
alter table rooms enable row level security;
alter table room_participants enable row level security;
alter table reports enable row level security;
alter table match_attempts enable row level security;

-- profiles: anyone signed in can read basic profile info (needed to
-- see a match's name/bio); a user can only edit their own row.
create policy "profiles are readable by signed-in users"
  on profiles for select
  using (auth.role() = 'authenticated');

create policy "users can insert their own profile"
  on profiles for insert
  with check (auth.uid() = id);

create policy "users can update their own profile"
  on profiles for update
  using (auth.uid() = id);

-- match_queue: a user manages only their own queue entry, but
-- needs to read the whole queue to find a candidate to match with.
create policy "queue is readable by signed-in users"
  on match_queue for select
  using (auth.role() = 'authenticated');

create policy "users manage their own queue entry"
  on match_queue for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- matches: only the two participants can see a match
create policy "participants can read their matches"
  on matches for select
  using (auth.uid() = user_a or auth.uid() = user_b);

create policy "signed-in users can create a match"
  on matches for insert
  with check (auth.uid() = user_a or auth.uid() = user_b);

-- messages: only participants of the parent match can read/write
create policy "participants can read match messages"
  on messages for select
  using (
    exists (
      select 1 from matches m
      where m.id = messages.match_id
      and (m.user_a = auth.uid() or m.user_b = auth.uid())
    )
  );

create policy "participants can send messages"
  on messages for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from matches m
      where m.id = messages.match_id
      and (m.user_a = auth.uid() or m.user_b = auth.uid())
    )
  );

-- call_logs: same access pattern as messages
create policy "participants can read call logs"
  on call_logs for select
  using (
    exists (
      select 1 from matches m
      where m.id = call_logs.match_id
      and (m.user_a = auth.uid() or m.user_b = auth.uid())
    )
  );

create policy "participants can insert call logs"
  on call_logs for insert
  with check (
    exists (
      select 1 from matches m
      where m.id = call_logs.match_id
      and (m.user_a = auth.uid() or m.user_b = auth.uid())
    )
  );

-- rooms: readable by everyone signed in, editable by the host
create policy "rooms are readable by signed-in users"
  on rooms for select
  using (auth.role() = 'authenticated');

create policy "hosts manage their own rooms"
  on rooms for all
  using (auth.uid() = host_id)
  with check (auth.uid() = host_id);

create policy "room participants readable by signed-in users"
  on room_participants for select
  using (auth.role() = 'authenticated');

create policy "users manage their own participation"
  on room_participants for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- reports: a user can file a report and read their own filed reports;
-- reports are otherwise private (reviewed via a moderation dashboard
-- using the service-role key, which bypasses RLS).
create policy "users can file reports"
  on reports for insert
  with check (auth.uid() = reporter_id);

create policy "users can read their own filed reports"
  on reports for select
  using (auth.uid() = reporter_id);

-- match_attempts: no direct client policies — only the try_match()
-- function writes here, and it runs as `security definer` so it
-- bypasses RLS entirely. Locking this down means a client can't
-- forge or clear their own rate-limit history.

-- ============================================================
-- try_match(p_user_id, p_interests)
-- Server-side matchmaking, run as a single transaction so two
-- users calling this at the same instant can't both claim the
-- same queue entry (the race condition the client-only version had).
-- Returns the matched profile row, or null if none was available
-- (in which case the caller has been added to the queue instead).
-- ============================================================
create or replace function try_match(p_user_id uuid, p_interests text[])
returns table (matched_id uuid, matched_match_id uuid) as $$
declare
  v_candidate uuid;
  v_match_id uuid;
begin
  perform enforce_match_rate_limit(p_user_id);

  if exists (select 1 from profiles where id = p_user_id and banned = true) then
    raise exception 'This account has been suspended';
  end if;

  -- Lock a candidate row so no other concurrent call can grab it too.
  select user_id into v_candidate
  from match_queue mq
  join profiles p on p.id = mq.user_id
  where mq.user_id <> p_user_id
    and mq.joined_at > now() - interval '60 seconds'
    and p.banned = false
    and (p_interests = '{}' or mq.interests && p_interests)
  order by mq.joined_at asc
  limit 1
  for update of mq skip locked;

  if v_candidate is not null then
    delete from match_queue where user_id = v_candidate;
    delete from match_queue where user_id = p_user_id;

    insert into matches (user_a, user_b) values (p_user_id, v_candidate)
    returning id into v_match_id;

    return query select v_candidate, v_match_id;
  else
    insert into match_queue (user_id, interests, joined_at)
    values (p_user_id, p_interests, now())
    on conflict (user_id) do update set interests = excluded.interests, joined_at = now();

    return query select null::uuid, null::uuid;
  end if;
end;
$$ language plpgsql security definer;

-- ============================================================
-- Rate limiting
-- Stops spam/abuse at the database level, regardless of what the
-- client does. Applies even if someone bypasses the UI and calls
-- the API directly.
-- ============================================================

-- Messages: max 30 per user per 60 seconds
create or replace function enforce_message_rate_limit()
returns trigger as $$
declare
  v_count int;
begin
  select count(*) into v_count
  from messages
  where sender_id = new.sender_id
    and created_at > now() - interval '60 seconds';

  if v_count >= 30 then
    raise exception 'Rate limit exceeded: too many messages, slow down';
  end if;

  return new;
end;
$$ language plpgsql;

drop trigger if exists messages_rate_limit on messages;
create trigger messages_rate_limit
  before insert on messages
  for each row execute function enforce_message_rate_limit();

-- Matchmaking: max 10 try_match calls per user per 60 seconds
create or replace function enforce_match_rate_limit(p_user_id uuid)
returns void as $$
declare
  v_count int;
begin
  select count(*) into v_count
  from match_attempts
  where user_id = p_user_id
    and attempted_at > now() - interval '60 seconds';

  if v_count >= 10 then
    raise exception 'Rate limit exceeded: too many match attempts, slow down';
  end if;

  insert into match_attempts (user_id) values (p_user_id);
end;
$$ language plpgsql;

-- Reports: max 5 per user per hour (prevents weaponizing the report system)
create or replace function enforce_report_rate_limit()
returns trigger as $$
declare
  v_count int;
begin
  select count(*) into v_count
  from reports
  where reporter_id = new.reporter_id
    and created_at > now() - interval '1 hour';

  if v_count >= 5 then
    raise exception 'Rate limit exceeded: too many reports filed recently';
  end if;

  return new;
end;
$$ language plpgsql;

drop trigger if exists reports_rate_limit on reports;
create trigger reports_rate_limit
  before insert on reports
  for each row execute function enforce_report_rate_limit();

-- Helper: keep profiles.updated_at fresh
-- ============================================================
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_set_updated_at on profiles;
create trigger profiles_set_updated_at
  before update on profiles
  for each row execute function set_updated_at();
