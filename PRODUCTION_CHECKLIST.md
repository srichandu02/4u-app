# 4U Production Deployment Checklist

Ensure all items are verified prior to promoting 4U to live production domains.

---

## 1. Environment Variables Configuration

- [x] Set `VITE_APP_MODE=production` in `.env.production`.
- [x] Set `VITE_SUPABASE_URL=https://<your-project-id>.supabase.co`.
- [x] Set `VITE_SUPABASE_ANON_KEY=<your-public-anon-key>`.
- [x] Verify no test or demo fallback keys are hardcoded in source files.

---

## 2. Authentication & Security

- [x] Enable Email OTP provider in Supabase Dashboard -> **Authentication** -> **Providers**.
- [x] Configure custom SMTP provider for transactional authentication emails (e.g., SendGrid, Postmark, Resend).
- [x] Confirm Site URL and Redirect URLs match production domains (e.g. `https://4u.social`).
- [x] Verify Row Level Security (RLS) is enabled on all tables in `schema_v3_production.sql`.
- [x] Verify Storage bucket security policies (avatars/covers public read; chat media & voice notes private to match participants).

---

## 3. Realtime & Signaling

- [x] Ensure Supabase Realtime is enabled for `messages`, `notifications`, `rooms`, `room_messages`, and `matches` tables.
- [x] Verify Realtime Broadcast channels for:
  - WebRTC signaling (`call-signaling-*`)
  - Live typing presence (`chat-presence-*`)
  - Live room floating reactions (`room-reactions-*`)
- [x] Check STUN/TURN server configuration in `src/services/callService.js`.

---

## 4. UI/UX & Mobile Responsiveness

- [x] Touch target minimum of 44px x 44px across all buttons and inputs.
- [x] Safe area insets handled via `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)`.
- [x] Responsive layout: Adaptive bottom navigation on mobile/tablet, full sidebar + activity rail on desktop.
- [x] Accessibility: Keyboard focus states, aria labels on icon buttons, `@media (prefers-reduced-motion)` overrides.

---

## 5. Build & Asset Optimization

- [x] Run `npm run build` with 0 compile errors.
- [x] Gzip compression verified under 100KB for core client bundle.
- [x] Clean client-side image compression in `src/services/storageService.js` before uploads.
- [x] Admin console isolated on `/admin.html` requiring Supabase Service Role key.
