# How to publish FindMyTravelPartnersPlease

This takes the app from "works on my laptop" to "anyone in the hostel can open the link".

**Before you start:** finish SETUP.md Parts 1–4 and the test checklist in TODO_FINAL.md. Publishing something you haven't tested makes problems harder to find.

You will need:
- GitHub repo: https://github.com/Aryan-Is-Here/FindMyTravelPartnersPlease (the code is already pushed there)
- Supabase project: `https://jjuogcufrtwcgtmmbffx.supabase.co`
- Your Google Cloud project from SETUP.md Part 2
- About 20 minutes

---

## Step 1 — Create a Vercel account
1. Go to https://vercel.com/signup.
2. Choose **Hobby** (free).
3. Click **Continue with GitHub** and allow access.

## Step 2 — Import the project
1. On the Vercel dashboard click **Add New…** → **Project**.
2. Find `FindMyTravelPartnersPlease` in the list → **Import**. If it's missing, click **Adjust GitHub App Permissions** and allow this repo.
3. Framework is detected as **Next.js**. Leave Build and Output settings as they are.

## Step 3 — Add the environment variables
Still on the import screen, open **Environment Variables** and add two entries. The values are in your `.env.local` file.

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://jjuogcufrtwcgtmmbffx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your `sb_publishable_…` key |

Only use the **publishable** key. Never put the `service_role` / secret key in Vercel or GitHub.

## Step 4 — Deploy
1. Click **Deploy** and wait about 1–2 minutes.
2. You get a live URL, for example `https://find-my-travel-partners-please.vercel.app`. Copy it.
3. Optional: under Project → **Settings → Domains** you can change the `.vercel.app` name to something shorter, like `fmtpp.vercel.app`, if it's free.

From here on, the instructions call this URL `https://YOUR-APP.vercel.app`.

## Step 5 — Tell Supabase about the live URL
1. Supabase dashboard → **Authentication** → **URL Configuration**.
2. **Site URL** → change to `https://YOUR-APP.vercel.app` → **Save**.
3. **Redirect URLs** → **Add URL** → `https://YOUR-APP.vercel.app/auth/callback` → **Save**.
4. Keep `http://localhost:3000/auth/callback` in the list, so local testing still works.

## Step 6 — Tell Google about the live URL
1. Go to https://console.cloud.google.com and select your project.
2. ☰ → **APIs & Services** → **Credentials** (or **Google Auth Platform → Clients**) → open your `Supabase` client.
3. **Authorized JavaScript origins** → **+ Add URI** → `https://YOUR-APP.vercel.app`.
4. Don't change **Authorized redirect URIs**. It stays `https://jjuogcufrtwcgtmmbffx.supabase.co/auth/v1/callback`.
5. **Save**.

## Step 7 — Publish the Google sign-in (leave Testing mode)
1. **Google Auth Platform** → **Branding**:
   - App home page: `https://YOUR-APP.vercel.app`
   - Privacy policy link: `https://YOUR-APP.vercel.app/privacy`
   - Leave logo and terms of service empty (adding a logo triggers a review).
   - **Save**.
2. **Audience** → **Publish app** → **Confirm**.
3. Status changes to **In production**. The app only asks for name, email and photo, so there's no Google review, and anyone with a Google account can log in.

## Step 8 — Final check
1. On your **phone**, open `https://YOUR-APP.vercel.app`.
2. Log in with a Gmail that was **not** a test user.
3. Finish onboarding, open the panel, and create and delete a test party.
4. Open `/privacy` without logging in. It must load. Google checks it.

If all of that works, share the link in the hostel WhatsApp groups. 🎉

---

## After launch

### Updating the site
Every push to the `main` branch on GitHub redeploys automatically in about 1 minute. To undo a bad update: Vercel → Project → **Deployments** → pick the last good one → **⋯ → Promote to Production** (instant rollback).

### Changing the database
Database changes don't deploy with Vercel. New SQL files go in `supabase/migrations/` and are run by hand in the Supabase SQL Editor, in number order.

### Watching the free limits
- Supabase → **Organization → Usage**: database size, storage, egress, realtime connections.
- Vercel → Project → **Usage**.
- SETUP.md has the limits table. At 400 users we expect to stay well under every limit.

### Before every holiday season
1. Open the Supabase dashboard. If the project is **Paused** (free projects pause after 1 week of no activity), click **Restore** and wait a few minutes. Data is kept.
2. Open the live site and log in once to confirm it works.
3. Then share the link again.

### Admin tasks
- **Un-suspend a user:** Supabase → Table Editor → `users` → set `status` to `active`.
- **Delete a user on request:** Supabase → Authentication → Users → find the email → **Delete user**. This removes their profile, trips, party memberships, messages and songs too.
- **See feedback:** SQL Editor → `select helpful, count(*) from feedback group by helpful;`

### Troubleshooting
| Problem | Fix |
|---|---|
| `redirect_uri_mismatch` on Google | Redirect URI in Google must be exactly `https://jjuogcufrtwcgtmmbffx.supabase.co/auth/v1/callback` |
| After login you land back on the login page | Step 5: Site URL / Redirect URL missing or wrong |
| "Access blocked: app in testing" | Step 7 not done (still Testing mode) |
| Site loads but lists are empty / errors | Supabase project paused, or env vars missing in Vercel (Step 3). After adding env vars, redeploy. |
| Build fails on Vercel | Open the deployment's **Build Logs** and send the error to Claude |
