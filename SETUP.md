# 4U App — Backend Setup Guide

This scaffold replaces the in-memory `window.storage` demo backend with a real
Supabase project: proper auth, a Postgres database, row-level security, and
real-time chat instead of polling.

## 1. Create the project

1. Go to https://supabase.com → New Project.
2. Once it's provisioned, open **Project Settings → API** and copy:
   - **Project URL**
   - **anon public key**
   (Never expose the `service_role` key in client code.)

## 2. Run the schema

Open **SQL Editor → New query**, paste the contents of `schema.sql`, and run
it. This creates:

- `profiles` — one row per user
- `match_queue` — who's currently waiting to be matched
- `matches` — confirmed pairings
- `messages` — chat + call-log + gift entries, scoped to a match
- `call_logs` — call attempts (completed / no-answer / declined)
- `rooms` / `room_participants` — live audio rooms
- `reports` — safety reports
- `try_match()` — a Postgres function that does matchmaking as one atomic
  transaction, so two people tapping "Connect" at the same instant can't both
  claim the same waiting user
- Row Level Security policies on every table, so a user can only read/write
  what they should (their own profile, matches they're part of, etc.)

## 3. Turn on Realtime

**Database → Replication** → enable replication for the `messages` and
`matches` tables. This is what lets `subscribeToMessages` and
`subscribeToIncomingMatch` push updates instantly instead of polling.

## 4. Configure email auth

**Authentication → Providers → Email** — OTP (magic code) sign-in is on by
default. No password reset flows to build or secure.

## 5. Install the client

```bash
npm install @supabase/supabase-js
```

Add to your `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 6. Files in this scaffold

| File | Purpose |
|---|---|
| `schema.sql` | Full database schema + RLS policies + matchmaking function |
| `supabaseClient.js` | Initializes the Supabase client |
| `auth.js` | Email OTP sign-in, profile creation, session listener |
| `matchmaking.js` | `tryMatch`, real-time chat subscriptions, call logging, reports |

## 7. Wiring it into the existing UI

The React app already has the right shape for this — it just needs its data
functions swapped:

- `storageGet('profile', false)` on boot → `getCurrentProfile()`
- `startOnboarding()` → `requestOtp(email)` then `verifyOtp(email, code)` then
  `createProfileIfMissing(...)`
- `attemptRealMatch()` → `tryMatch(me.id, selectedTags)`; if it returns
  `null`, call `subscribeToIncomingMatch(me.id, ...)` instead of the
  `setTimeout` polling loop
- `sendMessage()` → `sendMessage(matchId, me.id, text)`, with
  `subscribeToMessages(matchId, ...)` replacing the 2.5s polling `setInterval`
- `logCallToChat()` → `logCall(matchId, me.id, type, status, seconds)`

Everything else in the UI (screens, animations, layout) stays as-is — only
the data layer underneath changes.

## 8. What's still missing for a real launch

- **Calls**: this scaffold logs call *metadata* — actual audio/video needs
  Agora, Daily.co, or Twilio Video layered on top (see below)
- **Moderation**: `reports` table exists, but nothing reviews it yet — you'd
  want an admin dashboard or a queue a human (or a filter) checks
- **Push notifications**: not included — Firebase Cloud Messaging or OneSignal
  for "new match" / "new message" alerts
- **Rate limiting / abuse prevention**: RLS stops unauthorized reads/writes,
  but doesn't stop a user from spamming `try_match` — add a Postgres trigger
  or Edge Function rate limit before launch

## 9. Adding real calls (next step)

1. Sign up at https://www.daily.co or https://www.agora.io
2. Server-side (Edge Function or Cloud Function): given a `matchId`, create a
   room and return a short-lived join token — never mint tokens client-side
3. Client: install their JS SDK, join with the token, and wire the existing
   `CallView` component's mute/camera/end buttons to the SDK's real
   `setLocalAudio()` / `setLocalVideo()` / `leave()` methods instead of local
   React state
