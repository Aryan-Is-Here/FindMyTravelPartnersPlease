# Setup guide (one-time)

Your Supabase project: `https://jjuogcufrtwcgtmmbffx.supabase.co`
Keys are already in `.env.local`, so you only need the three parts below.

---

## Part 1 — Create the database (run the SQL file)

The SQL file already exists in the project: `supabase/migrations/0001_init.sql`.
It creates every table, the security rules, the functions the app calls, the photo bucket, and the daily cleanup job.

1. Open `supabase/migrations/0001_init.sql` in VS Code (or Notepad).
2. Press **Ctrl + A**, then **Ctrl + C** to copy all of it.
3. Go to https://supabase.com/dashboard and open your project.
4. In the left sidebar click **SQL Editor**.
5. Click **+ New query** (or the `+` tab).
6. Paste with **Ctrl + V**.
7. Click **Run** (bottom right), or press **Ctrl + Enter**.
8. If a popup warns about "destructive operations", click **Run this query**. (It's the `revoke` lines that remove permissions from anonymous visitors, which is intended.)
9. Success looks like a green "Success" message or a small result table showing a job id.
10. Check: left sidebar → **Table Editor**. You should see `users`, `trip_prefs`, `parties`, `party_members`, `join_requests`, `messages`, `songs`, `reports`, `feedback`.

**If it fails:** copy the error message and send it to Claude. Don't run the file a second time. A second run fails with "already exists" errors.
**If only the pg_cron part fails:** sidebar → **Database** → **Extensions** → search `pg_cron` → enable it. Then rerun only the last block of the file (from `create extension if not exists pg_cron;` to the end).

---

## Part 2 — Google sign-in (get Client ID + Client Secret)

Supabase needs a "Client ID" and "Client Secret", which you get from Google Cloud. They're free.

### 2a. Create a Google Cloud project
1. Go to https://console.cloud.google.com and sign in with your Google account.
2. Click the project dropdown at the top left (next to "Google Cloud"), then **New Project**.
3. Name: `FindMyTravelPartners` → **Create**.
4. Make sure the new project is selected in the dropdown.

### 2b. Set up the consent screen (what users see when they click "Continue with Google")
1. Left menu (☰) → **APIs & Services** → **OAuth consent screen**. Newer accounts see this as **Google Auth Platform**.
2. Click **Get started**.
3. **App information:** App name `FindMyTravelPartnersPlease`, User support email = your email → **Next**.
4. **Audience:** choose **External** → **Next**.
5. **Contact information:** your email → **Next**.
6. Tick the agreement → **Continue** → **Create**.
7. **For now, stay in "Testing" mode** and add yourself plus 2–3 friends as test users: **Audience** → **Test users** → **+ Add users** → enter their Gmail addresses. This is enough to test everything on localhost. Testing mode allows up to 100 test users, and they see a "Google hasn't verified this app" warning, which is fine for testing.
8. **Publishing (later, after Part 5 deploys the site):** publishing needs a home page URL, which we only get after deploying to Vercel. When the site is live:
   - **Branding** → App home page: `https://YOUR-APP.vercel.app` → Privacy policy link: `https://YOUR-APP.vercel.app/privacy` → **Save**. Leave logo and terms of service empty.
   - **Audience** → **Publish app** → **Confirm**.
   - The app only asks for name, email and photo (non-sensitive scopes), so it goes live immediately with no Google review.
   - Without the optional "brand verification" (2–3 days, needs a domain you own), the Google screen says "continue to jjuogcufrtwcgtmmbffx.supabase.co" instead of the app name. That's cosmetic; login works for everyone.

### 2c. Create the Client ID
1. Left side → **Clients** (or **APIs & Services → Credentials → + Create credentials → OAuth client ID**).
2. Click **+ Create client**.
3. **Application type:** `Web application`.
4. **Name:** `Supabase`.
5. **Authorized JavaScript origins** → **+ Add URI** → `http://localhost:3000`
6. **Authorized redirect URIs** → **+ Add URI** → paste exactly:
   ```
   https://jjuogcufrtwcgtmmbffx.supabase.co/auth/v1/callback
   ```
7. Click **Create**.
8. A popup shows the **Client ID** (ends in `.apps.googleusercontent.com`) and the **Client secret** (starts with `GOCSPX-`). Copy both somewhere safe. **Never share the secret** in chat or commit it to git.

### 2d. Paste them into Supabase
1. Supabase dashboard → **Authentication** → **Sign In / Providers** → **Google**.
2. Turn on **Enable Sign in with Google**.
3. **Client IDs:** paste the Client ID.
4. **Client Secret (for OAuth):** paste the Client secret.
5. Check that the **Callback URL** shown there is the same URL you added in step 2c.6.
6. **Save**.

---

## Part 3 — Tell Supabase where the app lives (URL Configuration)

After Google login, Supabase sends the user back to the app. It only redirects to URLs you allow.

1. Supabase dashboard → **Authentication** → **URL Configuration**.
2. **Site URL:** `http://localhost:3000` → **Save**.
3. **Redirect URLs** → **Add URL** → `http://localhost:3000/auth/callback` → **Save URLs**.
4. Later, after deploying to Vercel, add `https://YOUR-APP.vercel.app/auth/callback` here too. Also add `https://YOUR-APP.vercel.app` to Google's "Authorized JavaScript origins".

---

## Part 4 — Try it

1. In the project folder run `npm run dev`.
2. Open http://localhost:3000 → **Continue with Google**.
3. You should land on "About you" (Step 1 of 2).

Common errors:
- `redirect_uri_mismatch` (Google error page): the URI in step 2c.6 doesn't exactly match Supabase's callback URL.
- `Access blocked` / "app is in testing": that Gmail isn't in the test users list (step 2b.7), or publish the app (step 2b.8).
- You end up back on the login page: check Part 3.
- "relation does not exist" / "Could not find the table": Part 1 didn't run.

---

## Part 5 — Put it online

See **PUBLISH.md** for the full step-by-step (Vercel deploy, live URLs in Supabase + Google, publishing the Google app, after-launch checklist).

---

## Free tier limits (checked 2026-10-28)

Expected load: 400 users.

| Resource | Free limit | Our estimate for 400 users |
|---|---|---|
| Database size | 500 MB | Under 20 MB (profiles about 1 KB each; chat is deleted after trips) |
| File storage | 1 GB | About 10 MB (photos are shrunk to 256px, about 20 KB each) |
| Egress (data downloaded) | 5 GB + 5 GB cached / month | About 1–2 GB (photos are cached by browsers for a year) |
| Monthly active users | 50,000 | 400 |
| Realtime connections at the same time | 200 | Fine unless 200+ people have the site open at once |
| Realtime messages | 2 million / month | Far below |
| Compute | Shared CPU, 500 MB RAM | Fine for a few hundred users. This RAM is the "runs out of memory" people mention; it's for the database server, not for storage. |
| Pausing | After 1 week with no activity | Data is kept. Click "Restore" in the dashboard before the next holiday. |

Vercel Hobby (free) is for non-commercial use, which a hobby project is. Its 100 GB/month bandwidth is far more than needed.
