-- ============================================================
-- 4U App v2 — Production Database Migration Schema
-- Run this in the Supabase SQL editor (Project → SQL Editor → New query)
-- ============================================================

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- 1. PROFILES EXTENSIONS
-- ------------------------------------------------------------
alter table profiles add column if not exists username text unique;
alter table profiles add column if not exists avatar_url text;
alter table profiles add column if not exists cover_url text;
alter table profiles add column if not exists favorite_games text[] not null default '{}';
alter table profiles add column if not exists hobbies text[] not null default '{}';
alter table profiles add column if not exists xp int not null default 120;
alter table profiles add column if not exists level int not null default 1;
alter table profiles add column if not exists badges jsonb not null default '[]'::jsonb;
alter table profiles add column if not exists followers_count int not null default 0;
alter table profiles add column if not exists following_count int not null default 0;
alter table profiles add column if not exists friends_count int not null default 0;
alter table profiles add column if not exists posts_count int not null default 0;
alter table profiles add column if not exists privacy_settings jsonb not null default '{"profile_visibility":"public","who_can_message":"everyone","who_can_friend":"everyone"}'::jsonb;

-- ------------------------------------------------------------
-- 2. RELATIONSHIPS: FRIENDS & FOLLOWERS
-- ------------------------------------------------------------
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

create table if not exists friendships (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references profiles (id) on delete cascade,
  user_b uuid not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint different_friendship_users check (user_a <> user_b),
  constraint unique_friendship unique (user_a, user_b)
);

create table if not exists followers (
  follower_id uuid not null references profiles (id) on delete cascade,
  following_id uuid not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint different_follow_users check (follower_id <> following_id)
);

-- ------------------------------------------------------------
-- 3. SOCIAL FEED & POSTS
-- ------------------------------------------------------------
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

create table if not exists post_media (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts (id) on delete cascade,
  media_type text not null check (media_type in ('image', 'video')),
  url text not null,
  aspect_ratio numeric default 1.0,
  order_index int not null default 0,
  created_at timestamptz not null default now()
);

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

-- ------------------------------------------------------------
-- 4. HASHTAGS
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- 5. STORIES SYSTEM (24h EXPIRATION)
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- 6. SAFETY: BLOCK & MUTE
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- 7. NOTIFICATIONS CENTER
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- 8. MULTIPLAYER GAMES ENGINE
-- ------------------------------------------------------------
create table if not exists games (
  id text primary key,
  title text not null,
  description text not null,
  min_players int not null default 2,
  max_players int not null default 2,
  category text not null default 'multiplayer'
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

-- Seed Games Catalog
insert into games (id, title, description, min_players, max_players, category)
values
  ('tictactoe', 'Tic Tac Toe', 'Classic 3x3 grid strategy game. Get 3 in a row to win!', 2, 2, 'strategy'),
  ('rps', 'Rock Paper Scissors', 'Best of 3 quick hand battle with your match.', 2, 2, 'casual'),
  ('connect4', 'Connect Four', 'Drop tokens into 6x7 grid. Connect 4 of your color!', 2, 2, 'strategy'),
  ('trivia', 'Trivia Battle', 'Test your knowledge across movies, tech, music & anime.', 2, 4, 'trivia'),
  ('emojiguess', 'Emoji Guessing', 'Decode popular movies and phrases from emoji puzzles.', 2, 4, 'puzzle'),
  ('wouldyourather', 'Would You Rather', 'Answer intriguing dilemmas and compare choices.', 2, 10, 'social'),
  ('truthordare', 'Truth or Dare', 'Fun icebreaker game tailored for digital friends.', 2, 10, 'social')
on conflict (id) do update set title = excluded.title, description = excluded.description;

-- ------------------------------------------------------------
-- 9. GAMIFICATION: ACHIEVEMENTS & DAILY MISSIONS
-- ------------------------------------------------------------
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

-- Seed Achievements & Missions
insert into achievements (id, title, description, icon, xp_reward, coin_reward)
values
  ('first_friend', 'First Friend', 'Connect with your very first friend on 4U', '🤝', 50, 20),
  ('first_post', 'Social Starter', 'Share your first text or media post', '📝', 50, 20),
  ('game_master', 'Game Master', 'Win 5 multiplayer game matches', '🏆', 100, 50),
  ('streak_7', 'Week Warrior', 'Maintain a 7-day activity streak', '🔥', 150, 60),
  ('popular_creator', 'Popular Creator', 'Receive 50 likes across your posts', '⭐', 200, 100)
on conflict (id) do update set title = excluded.title, description = excluded.description;

insert into daily_missions (id, title, description, target_count, xp_reward, coin_reward)
values
  ('daily_login', 'Daily Check-in', 'Log in to 4U today', 1, 20, 10),
  ('make_post', 'Share an Update', 'Create 1 post or story', 1, 30, 15),
  ('like_posts', 'Show Some Love', 'Like 3 posts from friends', 3, 25, 10),
  ('play_game', 'Game Time', 'Play 1 game in the Games Hub', 1, 40, 20)
on conflict (id) do update set title = excluded.title, description = excluded.description;

-- ------------------------------------------------------------
-- 10. DISCOVERY HISTORY
-- ------------------------------------------------------------
create table if not exists discovery_history (
  user_id uuid not null references profiles (id) on delete cascade,
  target_id uuid not null references profiles (id) on delete cascade,
  action text not null check (action in ('pass', 'connect', 'follow')),
  created_at timestamptz not null default now(),
  primary key (user_id, target_id)
);

-- ------------------------------------------------------------
-- 11. ROW LEVEL SECURITY (RLS) POLICIES FOR NEW TABLES
-- ------------------------------------------------------------
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
alter table blocked_users enable row level security;
alter table muted_users enable row level security;
alter table notifications enable row level security;
alter table games enable row level security;
alter table game_sessions enable row level security;
alter table game_players enable row level security;
alter table game_moves enable row level security;
alter table game_invites enable row level security;
alter table achievements enable row level security;
alter table user_achievements enable row level security;
alter table daily_missions enable row level security;
alter table user_missions enable row level security;
alter table discovery_history enable row level security;

-- Public read / Authenticated policies
create policy "friend_requests_access" on friend_requests for all using (auth.uid() = requester_id or auth.uid() = receiver_id);
create policy "friendships_access" on friendships for all using (auth.uid() = user_a or auth.uid() = user_b);
create policy "followers_select" on followers for select using (auth.role() = 'authenticated');
create policy "followers_manage" on followers for all using (auth.uid() = follower_id);

create policy "posts_select" on posts for select using (auth.role() = 'authenticated');
create policy "posts_insert" on posts for insert with check (auth.uid() = author_id);
create policy "posts_update" on posts for update using (auth.uid() = author_id);
create policy "posts_delete" on posts for delete using (auth.uid() = author_id);

create policy "post_media_select" on post_media for select using (auth.role() = 'authenticated');
create policy "post_media_insert" on post_media for insert with check (auth.role() = 'authenticated');

create policy "post_likes_select" on post_likes for select using (auth.role() = 'authenticated');
create policy "post_likes_manage" on post_likes for all using (auth.uid() = user_id);

create policy "post_comments_select" on post_comments for select using (auth.role() = 'authenticated');
create policy "post_comments_insert" on post_comments for insert with check (auth.uid() = author_id);
create policy "post_comments_delete" on post_comments for delete using (auth.uid() = author_id);

create policy "stories_select" on stories for select using (auth.role() = 'authenticated');
create policy "stories_insert" on stories for insert with check (auth.uid() = author_id);
create policy "stories_delete" on stories for delete using (auth.uid() = author_id);

create policy "notifications_select" on notifications for select using (auth.uid() = user_id);
create policy "notifications_update" on notifications for update using (auth.uid() = user_id);

create policy "games_select" on games for select using (auth.role() = 'authenticated');
create policy "game_sessions_select" on game_sessions for select using (auth.role() = 'authenticated');
create policy "game_sessions_insert" on game_sessions for insert with check (auth.uid() = host_id);
create policy "game_sessions_update" on game_sessions for update using (auth.role() = 'authenticated');

create policy "game_players_all" on game_players for all using (auth.role() = 'authenticated');
create policy "game_moves_all" on game_moves for all using (auth.role() = 'authenticated');
create policy "game_invites_all" on game_invites for all using (auth.role() = 'authenticated');

create policy "achievements_select" on achievements for select using (auth.role() = 'authenticated');
create policy "user_achievements_select" on user_achievements for select using (auth.role() = 'authenticated');
create policy "daily_missions_select" on daily_missions for select using (auth.role() = 'authenticated');
create policy "user_missions_select" on user_missions for select using (auth.uid() = user_id);
create policy "user_missions_manage" on user_missions for all using (auth.uid() = user_id);

create policy "discovery_history_all" on discovery_history for all using (auth.uid() = user_id);
create policy "blocked_users_all" on blocked_users for all using (auth.uid() = blocker_id);
create policy "muted_users_all" on muted_users for all using (auth.uid() = muter_id);

-- ------------------------------------------------------------
-- 12. HELPER FUNCTIONS
-- ------------------------------------------------------------
create or replace function award_xp_and_coins(p_user_id uuid, p_xp int, p_coins int)
returns void as $$
begin
  update profiles
  set
    xp = xp + p_xp,
    coins = coins + p_coins,
    level = floor(1 + (xp + p_xp) / 200)::int
  where id = p_user_id;
end;
$$ language plpgsql security definer;
