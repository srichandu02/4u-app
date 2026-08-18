# 4U Verification & Testing Playbook

This document details manual and automated testing procedures to verify the 4U platform end-to-end.

---

## 1. Automated Build & Type Verification

Run the production build:
```bash
npm run build
```
Expected output:
```text
✓ built in ~800ms
dist/index.html
dist/admin.html
dist/assets/*
```

---

## 2. End-to-End Test Matrix

### A. Authentication & Onboarding
1. **Passwordless OTP Request**:
   - Enter email -> click "Continue with Email".
   - In dev mode: enter demo OTP `123456`.
   - In production mode: enter 6-digit code received via Supabase Auth email.
2. **Profile Completion**:
   - Provide display name, select birthdate (18+), accept Terms.
   - Click "Enter 4U" -> Verify immediate hydration into home feed.

### B. Social Feed & Ephemeral Stories
1. **Feed Posts**:
   - Tap `+` (Create) -> Select "Feed Post".
   - Type caption, pick tag (`#Gaming`), add image.
   - Publish -> Confirm post appears in "For You" feed immediately.
   - Tap Heart -> Confirm animated like burst & incremented counter.
   - Open Comments -> Post comment -> Confirm immediate rendering.
2. **Stories**:
   - Tap `+` (Create) -> Select "Story" -> Choose gradient or upload image.
   - Tap published story -> Confirm 5-second progress bar, pause on touch, live emoji reactions (`❤️`, `🔥`, `👏`).

### C. Discovery & Instant Matchmaking
1. **Instant Match**:
   - Go to "Discover" tab -> Tap "Instant Match".
   - Confirm radar pulse animation -> Match found card displays with compatibility breakdown.
   - Tap "Connect & Chat" -> Confirm chat opens immediately.
2. **Profile Deck**:
   - Filter by interest chips -> Review compatibility pills.
   - Tap "Follow" -> Confirm state changes to "Following".
   - Tap "Add Friend" -> Confirm friend request notification sent.

### D. Direct Messaging & Multimedia
1. **Chat Conversation**:
   - Send text message -> Verify single checkmark changes to double checkmark.
   - Type in input -> Verify other participant sees "User is typing…" indicator.
   - Upload image -> Verify image renders in chat bubble.
   - Record voice note -> Verify audio waveform playback.
2. **Game Challenges**:
   - Tap Gamepad icon in chat -> Select Tic Tac Toe.
   - Challenge card renders -> Tap "Accept Challenge" -> Launches game modal.

### E. Live Drop-in Audio Rooms
1. **Host Room**:
   - Go to "Rooms" tab -> Tap "Host Room".
   - Enter title "Tech Talk" -> Select tag "Tech" -> Go Live.
   - Confirm Host stage avatar renders with "Host" badge.
2. **Audience & Reactions**:
   - Join as listener -> Tap floating emojis -> Confirm flying emojis float upwards.
   - Send room chat message -> Renders in in-room live feed.
   - Tap "Ask to Speak" -> Role updates to "Requested".

### F. Games Hub & Gamification
1. **Play Games**:
   - Launch Tic Tac Toe, Connect Four, or Trivia.
   - Complete win -> Confetti fires across screen -> Toast awards `+40 XP & +20 Coins`.
   - Go to "Profile" -> Verify XP progress bar advances towards next Level.

### G. Admin & Moderation Console
1. **Access**:
   - Navigate to `/admin.html`.
   - Input Supabase Service Role key.
   - View live counters: Total Users, Total Posts, Pending Reports, Active Rooms.
2. **Incident Actions**:
   - View user report -> Click "Ban User" -> Confirm user banned status updates in Supabase database.
   - Click "Resolve" -> Removes item from pending queue.
