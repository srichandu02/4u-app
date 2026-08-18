# 4U Database Migration Guide (v3 Production)

This guide documents the full database migration process for the **4U Social Discovery Platform** using PostgreSQL on Supabase.

---

## 1. Prerequisites
1. A Supabase project created at [supabase.com](https://supabase.com).
2. Access to the Supabase SQL Editor.
3. Supabase Project URL (`https://<project-id>.supabase.co`) and public Anon Key.
4. Optional: Supabase Service Role Secret (for admin console operations).

---

## 2. Migration Execution Steps

### Step 1: Open Supabase SQL Editor
1. Log into your Supabase Dashboard.
2. In the left navigation, click on **SQL Editor**.
3. Click **New Query**.

### Step 2: Run `schema_v3_production.sql`
1. Open [`schema_v3_production.sql`](./schema_v3_production.sql) located in the project root.
2. Copy the entire contents of the SQL script.
3. Paste into the Supabase SQL query editor.
4. Click **Run** (or press `Ctrl + Enter` / `Cmd + Enter`).

---

## 3. What the Migration Provisions

### Tables (25+ tables)
- `profiles`: Core user profile with display name, age, city, bio, level, XP, coins, streak, verified status, privacy settings, and moderation flags (`banned`).
- `posts`: Media/text social feed posts with likes_count, comments_count, and shares_count.
- `post_likes`: Unique `(post_id, user_id)` like tracking with automated counter triggers.
- `post_comments`: Multi-level commenting with parent_comment_id support.
- `saved_posts`: Bookmarking mechanism.
- `post_reports`: Moderation queue reporting.
- `stories`: 24-hour ephemeral stories with background gradients and media attachments.
- `story_views`: Ephemeral story view tracking.
- `story_reactions`: Live emoji reactions on active stories.
- `matches`: Mutual connections and 1v1 private chat channels.
- `messages`: Multimedia direct messages, voice notes, and in-chat arcade challenge invites.
- `matchmaking_queue`: Concurrency-safe queue for instant 1v1 matching.
- `friend_requests`: Pending, accepted, and rejected friend requests.
- `friendships`: Bidirectional friendships with notification triggers.
- `follows`: Social follower graph.
- `blocked_users`: Mutual block lists enforcing messaging/calling safety.
- `rooms`: Live drop-in audio hangout rooms with host, title, and topic tags.
- `room_participants`: Stage speakers, requested speakers, and audience listeners.
- `room_messages`: In-room text chat feed.
- `room_reactions`: Floating stage emoji reactions.
- `call_logs`: Voice/video call session logs with duration and status.
- `game_sessions`: Multiplayer game states for TicTacToe, Connect4, RPS, and Trivia.
- `user_missions`: Daily engagement mission progress.
- `user_achievements`: Milestone reward badges.
- `notifications`: Real-time platform notifications.
- `reports`: Admin incident report tracking.

### Stored Procedures & Atomic RPCs
- `try_match(current_user_id, desired_tags)`: Transaction-safe queue match locking 2 candidate records and inserting into `matches`.
- `award_xp_and_coins(user_uuid, xp_gain, coin_gain)`: Level calculation and coin balance updates.
- Automated count triggers on `post_likes`, `post_comments`, and `follows`.

### Storage Buckets Configured
- `avatars` (Public): User profile avatars.
- `covers` (Public): Profile header backgrounds.
- `post-media` (Public): Photos and video clips in feed posts.
- `story-media` (Public): Ephemeral story images.
- `chat-media` (Private): Encrypted direct message photo attachments.
- `voice-notes` (Private): Audio recordings.

---

## 4. Verification

Execute the following verification query in the SQL editor:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

All 25+ tables will be listed with Row Level Security (`rowsecurity = true`).
