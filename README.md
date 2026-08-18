# 4U — Real-Time Social Discovery & Audio Rooms Platform

**4U** is a modern, mobile-first social discovery platform where creators meet, drop in on live audio rooms, share ephemeral stories, challenge friends to arcade games, and initiate instant 1v1 voice and video conversations.

---

## 🚀 Key Feature Pillars

### 1. Social Feed & Ephemeral Stories
- **Multi-Tab Feed**: Explore algorithmic "For You", "Following", and "Trending" posts.
- **Ephemeral Stories**: 24-hour expiration, animated timer progress bars, touch-to-pause, real-time viewer lists, and live reaction bursts.
- **Rich Media**: Photos and short videos with double-tap like burst micro-animations, comments, bookmarks, and author delete options.

### 2. Real-Time Discovery & Matchmaking
- **Instant Match Radar**: Real-time matchmaking queue pairing online users with concurrency safety and automated match timeouts.
- **Compatibility Breakdowns**: Multi-factor scoring (shared interests, city proximity, gaming habits).
- **Social Graph**: Bidirectional friendships, follower graph, mutual friend discovery, and safe user blocking.

### 3. Messaging & WebRTC Calls
- **Direct Messaging**: Multimedia attachments, voice note audio recordings with waveforms, typing indicators via Realtime broadcast channels, and message read receipts.
- **WebRTC Peer-to-Peer Calls**: Live voice and video call session controller (`WebRTCCallSession`) with STUN signaling over Supabase Realtime broadcast channels.
- **Arcade Challenges**: In-chat multiplayer challenge cards launching instant interactive game arenas.

### 4. Live Drop-in Audio Rooms
- **Stage Management**: Host, speaker, and audience roles.
- **Speaking Controls**: Audience members can "Ask to Speak" with host approvals.
- **Interactive Broadcasts**: Floating stage reactions and in-room live chat feed.

### 5. Social Arcade & Gamification
- **7 Multiplayer Games**: Tic Tac Toe, Connect Four, Rock Paper Scissors, Trivia Challenge, Emoji Guesser, Truth or Dare, and Would You Rather.
- **Progression Engine**: Level XP milestones, coin rewards, daily missions, and achievement showcase badges.

### 6. Safety & Moderation Console
- **Isolated Admin Portal** (`/admin.html`): Real-time metrics, incident report triage queue, and 1-click user bans enforcing database-level queue exclusion.

---

## 🛠️ Architecture & Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS with custom HSL dark design tokens, Lucide React icons, Canvas Confetti.
- **Backend & Database**: PostgreSQL on Supabase (25+ tables, Row Level Security, trigger functions for like/comment counters, atomic RPCs).
- **Real-Time Layer**: Supabase Realtime channels for instant messaging, WebRTC signaling, typing presence, and room reactions.
- **Storage**: Supabase Storage buckets for avatars, covers, post media, stories, and chat attachments.

---

## 📦 Project Structure

```text
4u-complete/
├── index.html                    # Main App client entry
├── admin.html                    # Admin & Moderation console
├── package.json
├── vite.config.js
├── tailwind.config.js
├── schema_v3_production.sql      # Complete 25+ table PostgreSQL schema & RLS
├── DATABASE_MIGRATION.md         # Database migration guide
├── PRODUCTION_CHECKLIST.md       # Pre-flight deployment checklist
├── TESTING.md                    # End-to-end testing playbook
├── src/
│   ├── App.jsx                   # Main layout (desktop sidebar/rail + mobile nav)
│   ├── index.css                 # 4U design tokens, glassmorphism & keyframes
│   ├── supabaseClient.js         # Supabase client with mode checks
│   ├── auth.js                   # Email OTP passwordless authentication
│   ├── matchmaking.js            # Queue matching & message logging
│   ├── components/
│   │   └── ui/                   # Reusable UI library (Avatar, BottomSheet, ConfirmDialog, etc.)
│   ├── services/                 # Core service layer
│   │   ├── feedService.js
│   │   ├── storyService.js
│   │   ├── friendService.js
│   │   ├── messageService.js
│   │   ├── callService.js        # WebRTC session controller & STUN signaling
│   │   ├── roomService.js        # Live audio rooms & broadcasts
│   │   ├── gameService.js        # Arcade catalog & scoring
│   │   ├── gamificationService.js# XP, coins, and levels
│   │   ├── notificationService.js# Realtime notification subscriptions
│   │   ├── profileService.js
│   │   └── storageService.js     # Image compression & bucket uploads
│   ├── features/                 # Modular feature domains
│   │   ├── home/                 # Feed & PostCard
│   │   ├── stories/              # Stories bar & viewer modal
│   │   ├── discover/             # Discover deck & radar matching
│   │   ├── chat/                 # Conversations, voice notes & game cards
│   │   ├── rooms/                # Live audio stage & audience
│   │   ├── games/                # 7 Arcade game components & hub
│   │   ├── profile/              # User profile, badges & privacy settings
│   │   ├── create/               # Unified modal for posts, stories & rooms
│   │   ├── notifications/        # Notification drawer
│   │   └── search/               # Global search modal
│   └── admin/
│       └── Admin.jsx             # Moderation & metrics console
```

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Create `.env` from `.env.example`:
```bash
cp .env.example .env
```
Fill in your Supabase credentials:
```env
VITE_APP_MODE=development
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

### 3. Run Database Migration
Follow [`DATABASE_MIGRATION.md`](./DATABASE_MIGRATION.md) and execute [`schema_v3_production.sql`](./schema_v3_production.sql) in your Supabase SQL Editor.

### 4. Start Development Server
```bash
npm run dev
```
Open `http://localhost:5173` to test the application.

### 5. Build for Production
```bash
npm run build
```
Production assets are output to the `dist/` directory.

---

## 🔒 Security & Safety

- **Row Level Security (RLS)** is enforced on all 25+ database tables.
- **Abuse Prevention**: Database-level rate limiting on messaging, matching attempts, and report creation.
- **Safety**: Instant 1-click user blocking, reporting to moderation queue, and granular privacy controls.
