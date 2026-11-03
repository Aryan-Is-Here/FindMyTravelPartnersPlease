# What's left before the project is final

Status as of **2026-11-03**: all pages and the database script are written, and the build passes. Nothing has run against the real database yet.

Priorities:
- **P0**: must happen before launch.
- **P1**: should happen before sharing it with the hostel.
- **P2**: nice to have.

---

## P0 — Launch blockers

| # | Task | Owner | Notes |
|---|------|-------|-------|
| 1 | Run `supabase/migrations/0001_init.sql` in the Supabase SQL Editor | Aryan | SETUP.md Part 1 |
| 2 | Create the Google OAuth client (Testing mode + test users) and enable Google in Supabase | Aryan | SETUP.md Part 2 |
| 3 | Set the Site URL and Redirect URL in Supabase | Aryan | SETUP.md Part 3 |
| 4 | Check the tables exist and fix any SQL errors | Claude | The SQL has never run on a real database |
| 5 | End-to-end test with 2–3 Google accounts | Aryan + Claude | Checklist below |
| 6 | Deploy to Vercel, add the live URL to Supabase + Google, publish the Google app | Aryan | PUBLISH.md |
| 7 | Final check on a phone, with a Gmail that is not a test user | Aryan | PUBLISH.md step 8 |

### End-to-end test checklist (task 5)
- [ ] Log in with Google and finish both onboarding steps
- [ ] Upload a profile photo
- [ ] Two accounts with matching gender preferences can see each other; with non-matching preferences they can't
- [ ] Filters work: city, date range, medium, year, and name search
- [ ] Create a party; the creator shows as head
- [ ] Request to join, then the head accepts → the member gets into the room
- [ ] Head invites someone, then the invitee accepts from the 🔔
- [ ] The bell count updates without refreshing
- [ ] Live chat: a message shows up in the other window without refreshing
- [ ] WhatsApp: numbers are visible only after **both** people share theirs; the wa.me link opens WhatsApp
- [ ] Add and remove songs in Vibe
- [ ] A member leaves; the head deletes the room → the feedback popup appears for members
- [ ] Report: blocked for someone you have no connection with; after 3 reports from connected accounts, the user lands on /suspended
- [ ] In browser DevTools, `select * from users` returns only your own row (no other phones visible)
- [ ] Profile edits save; College ID can't be edited

---

## P1 — Should do before sharing with the hostel

| # | Task | Why |
|---|------|-----|
| 8 | **"Delete my account" button** on the profile page | The privacy page promises deletion. Right now it's manual through the admin. |
| 9 | Replace browser `alert()` / `confirm()` / `prompt()` with styled dialogs and toasts | Report, delete room, leave party and errors currently use plain browser pop-ups. They look out of place in the new design. |
| 10 | **Cancel my join request** | A pending request can't be withdrawn now. |
| 11 | **Head removes a member** (kick) | No way to remove someone who joined. |
| 12 | **Edit party** (name, date, time, max size) | The database allows it, but there's no screen for it. |
| 13 | **"Other" city** → ask for the city name | Everyone who picks "Other" currently matches each other. |
| 14 | Custom **favicon / app icon** and a share image (Open Graph) | It still uses the default Next.js icon; WhatsApp link previews look bare. |
| 15 | Styled **404 page** | Default Next.js 404 doesn't match the design. |
| 16 | Unread badge for new chat messages in **Your parties** | Today you only notice a new message after opening the room. |
| 17 | Timezone fix for "today": date pickers use UTC, so before 5:30 AM IST "today" is still yesterday | Small bug in `useToday()` in `lib/constants.ts`. |
| 18 | Basic anti-spam limits (for example max 30 messages a minute, max 20 join requests a day) | Stops one person flooding a room or everyone's bell. |
| 19 | Show clear error messages when loading fails (no internet, Supabase paused) | Some screens just stay empty on errors. |
| 20 | Mobile polish pass on real phones (Android Chrome + iPhone Safari) | Date inputs and the sticky header behave differently per phone. |

---

## P2 — Nice to have

| # | Task |
|---|------|
| 21 | Multiple trips per user (going home *and* coming back), instead of one trip at a time |
| 22 | Use the Google profile photo as the default avatar |
| 23 | Delete old avatar files when a user uploads a new photo (saves storage) |
| 24 | Small admin page (reported users, suspend/unsuspend, feedback stats) instead of using the Supabase dashboard |
| 25 | "Add to Home Screen" support (PWA manifest) so it feels like an app |
| 26 | Daily "keep-alive" ping (GitHub Action) so the free Supabase project doesn't pause between holidays |
| 27 | Loading skeletons instead of "Loading…" text |
| 28 | Automated tests for the database functions (RLS, gender filter, phone privacy) |
| 29 | Terms of use page |
| 30 | Brand verification on Google (needs your own domain) so the sign-in screen shows the app name instead of supabase.co |

---

## Already decided as out of scope
- Push / email notifications (bell only)
- Spotify integration for Vibe (plain list + links)
- Phone number OTP verification
- College email verification (no usable domain)
