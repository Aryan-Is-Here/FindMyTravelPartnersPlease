# Project Context — FindMyTravelPartnersPlease

> Living document. Update it whenever a decision is made or progress happens, so anyone (or any new Claude session) can pick up without losing context.

**Last updated:** 2026-11-03

---

## 1. What this is

A small hobby website for our institute's hostel students. Before holidays, hostellers want company for the trip home: someone to share a cab to the station, sit with on the train, or split a car with. The site helps them find other hostellers **going to the same city around the same date**, form a group ("party"), and plan the trip together.

- **Name:** FindMyTravelPartnersPlease
- **Users:** hostel students of the institute (small scale, mostly on phones)
- **Deadline:** about 4 days from start (started 2026-10-27)
- **Owner:** Aryan

## 2. How it works (user flow)

1. **Login** with any Google account.
2. **Step 1, About you:** College User ID (permanent, can't change), name, photo, year (with a show/hide toggle), phone/WhatsApp, gender, budget.
3. **Step 2, What you want:** destination city, travel date, preferred departure time, travel mediums (bus/train/car/cab/flight/other), gender preference (Male / Female / "Ab to koi bhi chalega"), and a short bio.
4. **Main panel** has two tabs:
   - **People:** other hostellers with a limited public profile (name, photo, year if shown, budget, bio, city, date, time, mediums). Same city and closest date are shown first. Filters: city, date range, medium, year. Search by name. Buttons: "Invite to party", "Report".
   - **Parties:** open parties. Button: "Request to join".
   - Plus a **Create party** button and a **🔔 bell** that counts pending requests and invites.
5. **Party room** (members only):
   - WhatsApp consent card: your number is shared only if you agree, and you only see numbers of others who also agreed.
   - Live text chat.
   - **Vibe** tab: shared song list for the trip.
   - **People** tab: member list; the head accepts join requests here.
   - The head can delete the room anytime. Others can leave.
6. **After a room ends** (deleted by the head, or expired), each member is asked once: "Helpful or nah?"
7. **Profile page:** everything is editable except College User ID. Shows "people who want to travel with you" (pending requests and invites) and your parties.

## 3. Decisions made (and why)

| # | Decision | Why |
|---|----------|-----|
| 1 | Added **destination city + travel date + preferred time** to the trip form | The original spec had no destination or date, so there was nothing to match on. |
| 2 | City is a **fixed dropdown** (`lib/constants.ts`), not free text | So "Lucknow", "lucknow" and "LKO" don't become separate cities. |
| 3 | **Google sign-in, any Google account** | Not every student has a college Workspace email. |
| 4 | **No college-domain verification / verified badge** | No college domain works for this. Removed completely on 2026-10-28. |
| 5 | **Party-centric flow**: people join parties instead of adding 1:1 friends | One concept instead of two. A party = one trip. A user can be in several parties. |
| 6 | Join flow: the **head invites** or a **user requests**; the other side accepts | Both directions are needed from the panel. |
| 7 | **Room expiry = travel date + 2 days** (not 5 days from creation) | A fixed 5 days could delete the room before the trip happens. |
| 8 | Expiry is **lazy** (queries ignore expired rooms) plus a **daily pg_cron cleanup** of chat and songs | No custom server or cron job needed. |
| 9 | **Gender preference is mutual**: you see someone only if both preferences allow it | Safer, especially for women. |
| 10 | **Budget is display-only**, never used as a filter | Per the original requirement ("flexible"). |
| 11 | **Other users' data is never directly readable**; only server functions return public columns | Otherwise anyone could pull everyone's phone numbers from DevTools. |
| 12 | **Phones** only via `get_party_contacts`: consent required both ways | Privacy. |
| 13 | **Reports**: you can only report people you shared a party or request with; **3 unique reports → suspended** (not permanently banned). The admin reviews in the Supabase dashboard. | Stops 3 friends from banning a random person. |
| 14 | **Feedback** is stored per member after a room ends and shown on the next visit | Members may be offline when the room is deleted. |
| 15 | Notifications are **in-app only** (bell), no push or email | Time limit. |
| 16 | Vibe section is a **plain list** (title + optional link), no Spotify API | Time limit. |
| 17 | Photos are **resized on the phone** to 256px (about 20 KB) before upload, cached by browsers for 1 year, lazy-loaded; 2MB upload limit | Keeps Supabase free-tier egress (5 GB/month) safe with 400 users. |
| 18 | **Supabase free tier is enough** for 400+ users (see the limits table in SETUP.md) | DB under 20 MB of 500 MB, photos about 10 MB of 1 GB, egress about 1–2 GB of 5 GB. The "runs out of memory" warning refers to the 500 MB RAM compute, which is fine at this scale. |
| 19 | Google OAuth stays in **Testing mode** (up to 100 test users) for local testing; **publish after deploying to Vercel** | Publishing needs a home page URL, which only exists after deploy. Basic scopes mean no Google review is needed. |
| 20 | Added a public **/privacy** page, linked from login | Google's consent screen asks for a privacy policy link; it also builds trust with users. |
| 21 | Skip Google **brand verification** | Needs a domain we own. Without it, Google's screen shows the supabase.co address instead of the app name, which is only cosmetic. |
| 22 | **Visual identity:** muted sage grey, warm cream beige and deep burgundy, on a soft sage → cream → blush page gradient. **Six Caps** (ultra-condensed) for display, **Antonio** for labels, **Hanken Grotesk** for body. Signature element: people and party cards styled as **boarding passes**, with the destination set tall on a burgundy stub. The main panel is titled "Departures". | Owner asked for this palette and an ultra-condensed display face, aiming for a premium look. Boarding passes tie the design to travel. |

**Known accepted risks:**
- A suspended person could sign up again with another Gmail and a different College ID.
- Anyone can claim any College ID first. If someone squats yours, the admin fixes it in the Supabase dashboard.
- Profile photos are in a public bucket (anyone with the exact URL can see them).
- The free Supabase project pauses after about 1 week of no activity. Unpause it from the dashboard.

## 4. Tech stack

- **Next.js 16** (App Router, TypeScript), **Tailwind CSS v4**. Note: Next 16 calls middleware `proxy.ts`.
- **Supabase:** Postgres database, Google Auth, Storage (avatars), Realtime (chat + bell), pg_cron (cleanup).
- **Hosting:** Vercel (free) — not deployed yet.
- **GitHub:** https://github.com/Aryan-Is-Here/FindMyTravelPartnersPlease (branch `main`).
- **Design tokens:** `app/globals.css` (palette, `.ticket`, `.seg`, `.btn`, `.eyebrow`), fonts in `app/layout.tsx`.

## 5. Where things are

| Path | What |
|------|------|
| `supabase/migrations/0001_init.sql` | The whole database: tables, security rules (RLS), server functions, avatar bucket, realtime, cron. Run once in the Supabase SQL Editor. |
| `proxy.ts` | Runs on every page: login check → onboarding order → suspended block. |
| `lib/supabase/` | Supabase client helpers (browser + server). |
| `lib/constants.ts` | City list, mediums, time slots, gender options. Edit the city list here. |
| `lib/types.ts` | TypeScript types for data. |
| `app/login`, `app/auth/callback` | Google login. |
| `app/onboarding/details`, `app/onboarding/trip` | Step 1 and Step 2 forms. |
| `app/panel` | Main panel (People / Parties). |
| `app/party/new`, `app/party/[id]` | Create party, party room. |
| `app/profile` | Edit profile + inbox + my parties. |
| `app/suspended` | Shown to suspended users. |
| `app/privacy` | Public privacy policy (no login needed). |
| `components/` | Header (bell), Inbox, forms, Avatar, ReportButton, FeedbackModal. |
| `SETUP.md` | Step-by-step setup: SQL, Google Client ID, URL config, free-tier limits. |
| `PUBLISH.md` | Going live on Vercel, publishing Google sign-in, after-launch admin and troubleshooting. |
| `TODO_FINAL.md` | Everything left before the project is final (P0/P1/P2) plus the end-to-end test checklist. |
| `components/TicketStub.tsx`, `components/Wordmark.tsx` | Boarding-pass stub and logo wordmark. |
| `.env.local` | Supabase URL + publishable key (not committed). |

## 6. Progress

### Done
- [x] Idea validated, gaps found and fixed (see Decisions)
- [x] Build plan approved
- [x] Project created at `E:\Projects\FindMyTravelPartnersPlease`
- [x] Database SQL written (`0001_init.sql`)
- [x] All pages and components written
- [x] Lint, typecheck and production build pass
- [x] Supabase project created; URL + key saved in `.env.local`
- [x] Dev server runs; login page loads
- [x] Removed college-domain / verified badge feature
- [x] `SETUP.md` guide written
- [x] Verified Supabase free-tier limits; shrank avatars to protect egress
- [x] Public `/privacy` page added (needed for Google consent screen)
- [x] Redesign: sage / cream / burgundy palette, Six Caps display type, boarding-pass cards (checked in browser, desktop + mobile)
- [x] `TODO_FINAL.md` and `PUBLISH.md` written; professional `README.md` with screenshots
- [x] Code pushed to GitHub (`main`)

### Next (owner: Aryan)
- [ ] Run `0001_init.sql` in Supabase SQL Editor (SETUP.md Part 1)
- [ ] Create Google OAuth client (Testing mode + test users) and enable Google in Supabase (SETUP.md Part 2)
- [ ] Set Site URL + Redirect URL in Supabase (SETUP.md Part 3)

### Then (with Claude)
- [ ] Confirm the tables exist; fix any SQL errors
- [ ] End-to-end test with 2–3 Google accounts: onboarding, gender filter, create party, invite/request/accept, live chat, WhatsApp consent, songs, report → suspend, delete room → feedback popup
- [ ] P1 items in TODO_FINAL.md (delete account, styled dialogs, cancel request, kick member, edit party, "Other" city, favicon, ...)
- [ ] Deploy to Vercel (SETUP.md Part 5), add the production URL to Supabase + Google
- [ ] Publish the Google OAuth app with home page + /privacy URLs
- [ ] Share in hostel WhatsApp groups

### Not tested yet
- The SQL has not been run against a real database.
- Google login, realtime chat, and photo upload are untested.
- Logged-in pages after the redesign were checked only with a temporary static preview (sample data), not with real data.

## 7. Change log

- **2026-10-27:** Idea review; plan approved; project scaffolded; full app + SQL written; build passing; Supabase keys added.
- **2026-10-28:** Removed college domain + verified badge (no usable domain). Added `SETUP.md` and this file.
- **2026-10-28:** Google publish blocked by the missing home page URL, so: Testing mode now, publish after Vercel deploy; added `/privacy`. Checked Supabase free limits (fine for 400 users); avatars shrunk to 256px with long caching. GitHub repo linked.
- **2026-11-03:** Redesign (palette, Six Caps / Antonio / Hanken Grotesk, boarding-pass cards, "Departures" board). Added TODO_FINAL.md, PUBLISH.md, new README with screenshots. First commit pushed to GitHub.
