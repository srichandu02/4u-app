-- ============================================================
-- 4U App v3 — Complete Production Database Schema & Migration
-- ============================================================
-- Compatible with Supabase PostgreSQL (14+)
-- Execute in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

create extension if not exists "pgcrypto";

-- ============================================================
-- 1. PROFILES & USER IDENTITY
-- ============================================================
create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  username text unique,
  avatar_url text,
  cover_url text,
  age int check (age is null or age >= 18),
  birthdate date,
  city text,
  bio text default '',
  interests text[] not null default '{}',
  hobbies text[] not null default '{}',
  favorite_games text[] not null default '{}',
  verified boolean not null default false,
  banned boolean not null default false,
  is_admin boolean not null default false,
  coins int not null default 240,
  xp int not null default 120,
  level int not null default 1,
  streak int not null default 1,
  badges jsonb not null default '[]'::jsonb,
  followers_count int not null default 0,
  following_count int not null default 0,
  friends_count int not null default 0,
  posts_count int not null default 0,
  privacy_settings jsonb not null default '{"profile_visibility":"public","who_can_message":"everyone","who_can_friend":"everyone","who_can_call":"everyone"}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for usernames & search
create index if not exists idx_profiles_username on profiles (username);
create index if not exists idx_profiles_city on profiles (city);
create index if not exists idx_profiles_created_at on profiles (created_at desc);

-- ============================================================
-- 2. RELATIONSHIPS: FRIENDS & FOLLOWS
-- ============================================================
create table if not exists friend_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references profiles (id) on delete cascade,
  receiver_id uuid not null references profiles (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint different_request_users check (requester_id <> receiver_id),
  constraint unique_friend_request unique (requester_id, receiver_id)
);

create index if not exists idx_friend_requests_receiver on friend_requests (receiver_id, status);
create index if not exists idx_friend_requests_requester on friend_requests (requester_id, status);

create table if not exists friendships (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references profiles (id) on delete cascade,
  user_b uuid not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint different_friendship_users check (user_a <> user_b),
  constraint unique_friendship unique (user_a, user_b)
);

create index if not exists idx_friendships_user_a on friendships (user_a);
create index if not exists idx_friendships_user_b on friendships (user_b);

create table if not exists followers (
  follower_id uuid not null references profiles (id) on delete cascade,
  following_id uuid not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint different_follow_users check (follower_id <> following_id)
);

create index if not exists idx_followers_following on followers (following_id);

-- ============================================================
-- 3. SOCIAL POSTS, COMMENTS, MEDIA & REACTIONS
-- ============================================================
create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references profiles (id) on delete cascade,
  content text not null default '',
  audience text not null default 'public' check (audience in ('public', 'friends', 'close_friends', 'only_me')),
  likes_count int not null default 0,
  comments_count int not null default 0,
  shares_count int not null default 0,
  saves_count int not null default 0,
  is_pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_posts_author on posts (author_id);
create index if not exists idx_posts_created_at on posts (created_at desc);

create table if not exists post_media (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts (id) on delete cascade,
  media_type text not null check (media_type in ('image', 'video')),
  url text not null,
  aspect_ratio numeric default 1.0,
  order_index int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_post_media_post_id on post_media (post_id, order_index);

create table if not exists post_likes (
  post_id uuid not null references posts (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  reaction text not null default '❤️',
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts (id) on delete cascade,
  author_id uuid not null references profiles (id) on delete cascade,
  parent_id uuid references post_comments (id) on delete cascade,
  content text not null,
  likes_count int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_post_comments_post_id on post_comments (post_id, created_at asc);

create table if not exists comment_likes (
  comment_id uuid not null references post_comments (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);

create table if not exists post_saves (
  post_id uuid not null references posts (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists post_shares (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists hashtags (
  id uuid primary key default gen_random_uuid(),
  tag text not null unique,
  posts_count int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists post_hashtags (
  post_id uuid not null references posts (id) on delete cascade,
  hashtag_id uuid not null references hashtags (id) on delete cascade,
  primary key (post_id, hashtag_id)
);

-- ============================================================
-- 4. 24-HOUR EPHEMERAL STORIES
-- ============================================================
create table if not exists stories (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references profiles (id) on delete cascade,
  media_type text not null check (media_type in ('image', 'video', 'text')),
  media_url text,
  text_content text,
  background_gradient text,
  expires_at timestamptz not null default (now() + interval '24 hours'),
  created_at timestamptz not null default now()
);

create index if not exists idx_stories_author on stories (author_id);
create index if not exists idx_stories_expires_at on stories (expires_at);

create table if not exists story_views (
  story_id uuid not null references stories (id) on delete cascade,
  viewer_id uuid not null references profiles (id) on delete cascade,
  viewed_at timestamptz not null default now(),
  primary key (story_id, viewer_id)
);

create table if not exists story_reactions (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references stories (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  reaction text not null,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 5. MATCHMAKING & DISCOVERY
-- ============================================================
create table if not exists match_queue (
  user_id uuid primary key references profiles (id) on delete cascade,
  interests text[] not null default '{}',
  joined_at timestamptz not null default now()
);

create table if not exists matches (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references profiles (id) on delete cascade,
  user_b uuid not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint different_match_users check (user_a <> user_b)
);

create index if not exists idx_matches_user_a on matches (user_a);
create index if not exists idx_matches_user_b on matches (user_b);

create table if not exists match_attempts (
  user_id uuid not null references profiles (id) on delete cascade,
  attempted_at timestamptz not null default now()
);

create table if not exists discovery_history (
  user_id uuid not null references profiles (id) on delete cascade,
  target_id uuid not null references profiles (id) on delete cascade,
  action text not null check (action in ('pass', 'connect', 'follow')),
  created_at timestamptz not null default now(),
  primary key (user_id, target_id)
);

-- ============================================================
-- 6. MESSAGING & CALL LOGS
-- ============================================================
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references matches (id) on delete cascade,
  sender_id uuid not null references profiles (id) on delete cascade,
  kind text not null default 'text', -- 'text' | 'image' | 'voice_note' | 'game_invite' | 'gift' | 'call_log'
  body text not null,
  media_url text,
  metadata jsonb default '{}'::jsonb,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_messages_match_id on messages (match_id, created_at asc);

create table if not exists call_logs (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references matches (id) on delete cascade,
  caller_id uuid not null references profiles (id) on delete cascade,
  call_type text not null check (call_type in ('audio', 'video')),
  status text not null check (status in ('completed', 'no_answer', 'declined', 'failed')),
  duration_seconds int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_call_logs_match_id on call_logs (match_id);

-- ============================================================
-- 7. LIVE AUDIO ROOMS
-- ============================================================
create table if not exists rooms (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references profiles (id) on delete cascade,
  title text not null,
  tag text default 'General',
  is_live boolean not null default true,
  max_speakers int not null default 6,
  created_at timestamptz not null default now()
);

create index if not exists idx_rooms_is_live on rooms (is_live, created_at desc);

create table if not exists room_participants (
  room_id uuid not null references rooms (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  role text not null default 'listener' check (role in ('host', 'speaker', 'requested', 'listener')),
  is_muted boolean not null default false,
  joined_at timestamptz not null default now(),
  primary key (room_id, user_id)
);

create table if not exists room_messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  text text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_room_messages on room_messages (room_id, created_at asc);

-- ============================================================
-- 8. MULTIPLAYER GAMES ENGINE
-- ============================================================
create table if not exists games (
  id text primary key,
  title text not null,
  description text not null,
  min_players int not null default 2,
  max_players int not null default 2,
  category text not null default 'casual'
);

create table if not exists game_sessions (
  id uuid primary key default gen_random_uuid(),
  game_id text not null references games (id) on delete cascade,
  host_id uuid not null references profiles (id) on delete cascade,
  status text not null default 'waiting' check (status in ('waiting', 'in_progress', 'completed', 'cancelled')),
  state jsonb not null default '{}'::jsonb,
  current_turn uuid references profiles (id) on delete set null,
  winner_id uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_game_sessions_host on game_sessions (host_id);

create table if not exists game_players (
  session_id uuid not null references game_sessions (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  score int not null default 0,
  joined_at timestamptz not null default now(),
  primary key (session_id, user_id)
);

create table if not exists game_moves (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references game_sessions (id) on delete cascade,
  player_id uuid not null references profiles (id) on delete cascade,
  move jsonb not null,
  move_number int not null,
  created_at timestamptz not null default now()
);

create table if not exists game_invites (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references game_sessions (id) on delete cascade,
  sender_id uuid not null references profiles (id) on delete cascade,
  receiver_id uuid not null references profiles (id) on delete cascade,
  game_id text not null references games (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now()
);

create index if not exists idx_game_invites_receiver on game_invites (receiver_id, status);

-- Seed Default Games Catalog
insert into games (id, title, description, min_players, max_players, category)
values
  ('tictactoe', 'Tic Tac Toe', 'Classic 3x3 strategic grid battle. First to 3 in a line wins.', 2, 2, 'Strategy'),
  ('rps', 'Rock Paper Scissors', 'Rapid best-of-3 hand challenge with real-time picks.', 2, 2, 'Casual'),
  ('connect4', 'Connect Four', 'Tactical 6x7 gravity board. Connect 4 discs to take victory.', 2, 2, 'Strategy'),
  ('trivia', 'Trivia Battle', 'Showdown across Tech, Music, Movies, Gaming & Pop Culture.', 2, 4, 'Trivia'),
  ('emojiguess', 'Emoji Guess', 'Solve iconic movie, song, and phrase puzzles from emojis.', 2, 4, 'Puzzle'),
  ('wouldyourather', 'Would You Rather', 'Provocative dilemmas & live community choice comparison.', 2, 10, 'Social'),
  ('truthordare', 'Truth or Dare', 'Interactive party icebreakers tailored for digital connection.', 2, 10, 'Social')
on conflict (id) do update set title = excluded.title, description = excluded.description;

-- ============================================================
-- 9. GAMIFICATION: ACHIEVEMENTS & MISSIONS
-- ============================================================
create table if not exists achievements (
  id text primary key,
  title text not null,
  description text not null,
  icon text not null,
  xp_reward int not null default 50,
  coin_reward int not null default 20
);

create table if not exists user_achievements (
  user_id uuid not null references profiles (id) on delete cascade,
  achievement_id text not null references achievements (id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

create table if not exists daily_missions (
  id text primary key,
  title text not null,
  description text not null,
  target_count int not null default 1,
  xp_reward int not null default 30,
  coin_reward int not null default 15
);

create table if not exists user_missions (
  user_id uuid not null references profiles (id) on delete cascade,
  mission_id text not null references daily_missions (id) on delete cascade,
  progress int not null default 0,
  completed boolean not null default false,
  claimed boolean not null default false,
  date_assigned date not null default current_date,
  primary key (user_id, mission_id, date_assigned)
);

insert into achievements (id, title, description, icon, xp_reward, coin_reward)
values
  ('first_friend', 'First Connection', 'Form your first confirmed friendship on 4U', '🤝', 50, 20),
  ('first_post', 'Social Spark', 'Publish your first photo, video, or update', '📝', 50, 20),
  ('game_master', 'Game Champion', 'Win 5 multiplayer duels in the Games Hub', '🏆', 100, 50),
  ('streak_7', 'Week Warrior', 'Maintain an unbroken 7-day social streak', '🔥', 150, 60),
  ('popular_creator', 'Spotlight Star', 'Earn 50+ total reactions on your posts', '⭐', 200, 100)
on conflict (id) do update set title = excluded.title, description = excluded.description;

insert into daily_missions (id, title, description, target_count, xp_reward, coin_reward)
values
  ('daily_login', 'Daily Check-in', 'Open 4U and check the discovery feed', 1, 20, 10),
  ('make_post', 'Share an Update', 'Create a post or add to your story', 1, 30, 15),
  ('like_posts', 'Show Some Love', 'Like 3 posts from fellow creators', 3, 25, 10),
  ('play_game', 'Arcade Match', 'Play a game in the Games Hub with a friend', 1, 40, 20)
on conflict (id) do update set title = excluded.title, description = excluded.description;

-- ============================================================
-- 10. SAFETY, MODERATION & NOTIFICATIONS
-- ============================================================
create table if not exists blocked_users (
  blocker_id uuid not null references profiles (id) on delete cascade,
  blocked_id uuid not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint different_block_users check (blocker_id <> blocked_id)
);

create table if not exists muted_users (
  muter_id uuid not null references profiles (id) on delete cascade,
  muted_id uuid not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (muter_id, muted_id),
  constraint different_mute_users check (muter_id <> muted_id)
);

create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references profiles (id) on delete cascade,
  reported_id uuid not null references profiles (id) on delete cascade,
  context text not null default 'general', -- 'feed' | 'chat' | 'call' | 'room' | 'profile'
  reason text not null,
  status text not null default 'pending' check (status in ('pending', 'resolved', 'dismissed')),
  created_at timestamptz not null default now()
);

create index if not exists idx_reports_status on reports (status, created_at desc);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  actor_id uuid references profiles (id) on delete cascade,
  type text not null, -- 'friend_request' | 'friend_accept' | 'follow' | 'post_like' | 'comment' | 'mention' | 'game_invite' | 'story_reaction' | 'achievement'
  entity_id uuid,
  entity_type text,
  title text not null,
  body text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user on notifications (user_id, is_read, created_at desc);

-- ============================================================
-- 11. DATABASE FUNCTIONS & AUTOMATIC TRIGGERS
-- ============================================================

-- Function: Award XP and compute Level automatically
create or replace function award_xp_and_coins(p_user_id uuid, p_xp int, p_coins int)
returns void as $$
begin
  update profiles
  set
    xp = xp + p_xp,
    coins = coins + p_coins,
    level = floor(1 + (xp + p_xp) / 200)::int,
    updated_at = now()
  where id = p_user_id;
end;
$$ language plpgsql security definer;

-- Function: Atomic matchmaking queue pairing
create or replace function try_match(p_user_id uuid, p_interests text[])
returns table (matched_id uuid, matched_match_id uuid) as $$
declare
  candidate_id uuid;
  new_match_id uuid;
begin
  -- Find an eligible waiting candidate from match_queue who is not the same user
  -- and not blocked by either user
  select mq.user_id into candidate_id
  from match_queue mq
  where mq.user_id <> p_user_id
    and not exists (
      select 1 from blocked_users b
      where (b.blocker_id = p_user_id and b.blocked_id = mq.user_id)
         or (b.blocker_id = mq.user_id and b.blocked_id = p_user_id)
    )
  order by (
    select count(*) from unnest(mq.interests) i
    where i = any(p_interests)
  ) desc, mq.joined_at asc
  limit 1
  for update skip locked;

  if candidate_id is not null then
    -- Remove candidate from queue
    delete from match_queue where user_id = candidate_id;
    delete from match_queue where user_id = p_user_id;

    -- Create new match record
    insert into matches (user_a, user_b)
    values (candidate_id, p_user_id)
    returning id into new_match_id;

    return query select candidate_id, new_match_id;
  else
    -- Add current user to queue
    insert into match_queue (user_id, interests, joined_at)
    values (p_user_id, p_interests, now())
    on conflict (user_id) do update set interests = p_interests, joined_at = now();

    return query select null::uuid, null::uuid;
  end if;
end;
$$ language plpgsql security definer;

-- Trigger: Post Like Counter Management
create or replace function handle_post_like_change()
returns trigger as $$
begin
  if tg_op = 'INSERT' then
    update posts set likes_count = likes_count + 1 where id = new.post_id;
  elsif tg_op = 'DELETE' then
    update posts set likes_count = greatest(0, likes_count - 1) where id = old.post_id;
  end if;
  return null;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_post_like_counter on post_likes;
create trigger trg_post_like_counter
after insert or delete on post_likes
for each row execute function handle_post_like_change();

-- Trigger: Post Comment Counter Management
create or replace function handle_post_comment_change()
returns trigger as $$
begin
  if tg_op = 'INSERT' then
    update posts set comments_count = comments_count + 1 where id = new.post_id;
  elsif tg_op = 'DELETE' then
    update posts set comments_count = greatest(0, comments_count - 1) where id = old.post_id;
  end if;
  return null;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_post_comment_counter on post_comments;
create trigger trg_post_comment_counter
after insert or delete on post_comments
for each row execute function handle_post_comment_change();

-- Trigger: Follower / Following Counter Management
create or replace function handle_follower_change()
returns trigger as $$
begin
  if tg_op = 'INSERT' then
    update profiles set following_count = following_count + 1 where id = new.follower_id;
    update profiles set followers_count = followers_count + 1 where id = new.following_id;
  elsif tg_op = 'DELETE' then
    update profiles set following_count = greatest(0, following_count - 1) where id = old.follower_id;
    update profiles set followers_count = greatest(0, followers_count - 1) where id = old.following_id;
  end if;
  return null;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_follower_counter on followers;
create trigger trg_follower_counter
after insert or delete on followers
for each row execute function handle_follower_change();

-- ============================================================
-- 12. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

alter table profiles enable row level security;
alter table friend_requests enable row level security;
alter table friendships enable row level security;
alter table followers enable row level security;
alter table posts enable row level security;
alter table post_media enable row level security;
alter table post_likes enable row level security;
alter table post_comments enable row level security;
alter table comment_likes enable row level security;
alter table post_saves enable row level security;
alter table post_shares enable row level security;
alter table hashtags enable row level security;
alter table post_hashtags enable row level security;
alter table stories enable row level security;
alter table story_views enable row level security;
alter table story_reactions enable row level security;
alter table match_queue enable row level security;
alter table matches enable row level security;
alter table match_attempts enable row level security;
alter table discovery_history enable row level security;
alter table messages enable row level security;
alter table call_logs enable row level security;
alter table rooms enable row level security;
alter table room_participants enable row level security;
alter table room_messages enable row level security;
alter table games enable row level security;
alter table game_sessions enable row level security;
alter table game_players enable row level security;
alter table game_moves enable row level security;
alter table game_invites enable row level security;
alter table achievements enable row level security;
alter table user_achievements enable row level security;
alter table daily_missions enable row level security;
alter table user_missions enable row level security;
alter table blocked_users enable row level security;
alter table muted_users enable row level security;
alter table reports enable row level security;
alter table notifications enable row level security;

-- Profiles: Public read, owner update
create policy "profiles_select_all" on profiles for select using (true);
create policy "profiles_insert_own" on profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on profiles for update using (auth.uid() = id);

-- Relationships
create policy "friend_requests_rw" on friend_requests for all using (auth.uid() = requester_id or auth.uid() = receiver_id);
create policy "friendships_rw" on friendships for all using (auth.uid() = user_a or auth.uid() = user_b);
create policy "followers_read" on followers for select using (true);
create policy "followers_write" on followers for all using (auth.uid() = follower_id);

-- Posts
create policy "posts_read" on posts for select using (true);
create policy "posts_insert" on posts for insert with check (auth.uid() = author_id);
create policy "posts_update" on posts for update using (auth.uid() = author_id);
create policy "posts_delete" on posts for delete using (auth.uid() = author_id);

create policy "post_media_read" on post_media for select using (true);
create policy "post_media_write" on post_media for all using (auth.role() = 'authenticated');

create policy "post_likes_read" on post_likes for select using (true);
create policy "post_likes_write" on post_likes for all using (auth.uid() = user_id);

create policy "post_comments_read" on post_comments for select using (true);
create policy "post_comments_write" on post_comments for insert with check (auth.uid() = author_id);
create policy "post_comments_delete" on post_comments for delete using (auth.uid() = author_id);

create policy "comment_likes_read" on comment_likes for select using (true);
create policy "comment_likes_write" on comment_likes for all using (auth.uid() = user_id);

create policy "post_saves_all" on post_saves for all using (auth.uid() = user_id);
create policy "post_shares_all" on post_shares for all using (auth.uid() = user_id);

create policy "hashtags_read" on hashtags for select using (true);
create policy "post_hashtags_read" on post_hashtags for select using (true);

-- Stories (Visible until expiration)
create policy "stories_read" on stories for select using (expires_at > now());
create policy "stories_insert" on stories for insert with check (auth.uid() = author_id);
create policy "stories_delete" on stories for delete using (auth.uid() = author_id);

create policy "story_views_all" on story_views for all using (auth.role() = 'authenticated');
create policy "story_reactions_all" on story_reactions for all using (auth.role() = 'authenticated');

-- Matchmaking & Queue
create policy "match_queue_all" on match_queue for all using (auth.uid() = user_id);
create policy "matches_read" on matches for select using (auth.uid() = user_a or auth.uid() = user_b);
create policy "matches_insert" on matches for insert with check (auth.role() = 'authenticated');
create policy "discovery_history_all" on discovery_history for all using (auth.uid() = user_id);

-- Messages (Only match participants)
create policy "messages_select" on messages for select using (
  exists (
    select 1 from matches m
    where m.id = messages.match_id and (m.user_a = auth.uid() or m.user_b = auth.uid())
  )
);
create policy "messages_insert" on messages for insert with check (
  auth.uid() = sender_id and exists (
    select 1 from matches m
    where m.id = match_id and (m.user_a = auth.uid() or m.user_b = auth.uid())
  )
);

create policy "call_logs_select" on call_logs for select using (
  exists (
    select 1 from matches m
    where m.id = call_logs.match_id and (m.user_a = auth.uid() or m.user_b = auth.uid())
  )
);
create policy "call_logs_insert" on call_logs for insert with check (auth.uid() = caller_id);

-- Rooms
create policy "rooms_read" on rooms for select using (true);
create policy "rooms_write" on rooms for insert with check (auth.uid() = host_id);
create policy "rooms_update" on rooms for update using (auth.uid() = host_id);
create policy "room_participants_all" on room_participants for all using (auth.role() = 'authenticated');
create policy "room_messages_read" on room_messages for select using (true);
create policy "room_messages_insert" on room_messages for insert with check (auth.uid() = user_id);

-- Games
create policy "games_read" on games for select using (true);
create policy "game_sessions_all" on game_sessions for all using (auth.role() = 'authenticated');
create policy "game_players_all" on game_players for all using (auth.role() = 'authenticated');
create policy "game_moves_all" on game_moves for all using (auth.role() = 'authenticated');
create policy "game_invites_all" on game_invites for all using (auth.role() = 'authenticated');

-- Gamification
create policy "achievements_read" on achievements for select using (true);
create policy "user_achievements_all" on user_achievements for all using (auth.uid() = user_id);
create policy "daily_missions_read" on daily_missions for select using (true);
create policy "user_missions_all" on user_missions for all using (auth.uid() = user_id);

-- Safety & Moderation
create policy "blocked_users_all" on blocked_users for all using (auth.uid() = blocker_id);
create policy "muted_users_all" on muted_users for all using (auth.uid() = muter_id);
create policy "reports_insert" on reports for insert with check (auth.uid() = reporter_id);
create policy "reports_select_admin" on reports for select using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin = true)
);

-- Notifications
create policy "notifications_select" on notifications for select using (auth.uid() = user_id);
create policy "notifications_update" on notifications for update using (auth.uid() = user_id);

-- ============================================================
-- 13. STORAGE BUCKETS SETUP (Run via Supabase Storage UI or API)
-- ============================================================
-- Required public & protected storage buckets:
-- 1. `avatars` (public read, authenticated user write)
-- 2. `covers` (public read, authenticated user write)
-- 3. `post-media` (public read, authenticated user write)
-- 4. `stories` (public read, authenticated user write)
-- 5. `chat-media` (authenticated participant read/write)
-- 6. `voice-notes` (authenticated participant read/write)
