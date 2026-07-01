# DMGS Alumni — No-Terminal Setup Guide

Everything below is done by clicking in apps and dashboards. You never open a
terminal. Do the parts in order: **GitHub → Supabase → Vercel**.

Have the unzipped `dmgs-alumni` folder ready.

---

## Part 1 — Put the code on GitHub (GitHub Desktop app)

1. Download and install **GitHub Desktop** from <https://desktop.github.com>.
   Sign in with your GitHub account (it creates one if you don't have it).
2. In GitHub Desktop: **File → Add Local Repository**.
3. Choose your unzipped `dmgs-alumni` folder. It will say *"this directory is
   not a Git repository"* — click **"create a repository"**.
4. On the create screen, leave the name as `dmgs-alumni`, click
   **Create Repository**.
5. Top bar: click **Publish repository**.
   - Untick *"Keep this code private"* only if you want it public. For a client
     project, **leave it private (ticked)**.
   - Click **Publish Repository**.

Done — your code is on GitHub. Whenever code changes later, GitHub Desktop shows
the changes; you click **Commit** then **Push origin**. No terminal ever.

> The `.gitignore` already excludes `node_modules`, so only source code uploads.

---

## Part 2 — Supabase project + database (dashboard only)

### 2a. Create the project
1. Go to <https://supabase.com/dashboard>, sign in.
2. **New project** → same organization as MedRev.
   - Name: `DMGS-Alumni`
   - Database password: generate one and **save it** (password manager).
   - Region: choose **East US (North Virginia)** — most of this chapter is in
     North America. (Any region works; this just reduces latency.)
   - Click **Create new project**, wait ~2 minutes for it to provision.

### 2b. Apply the whole database in one paste
1. Left sidebar → **SQL Editor** → **New query**.
2. Open the file `supabase/setup.sql` from your project, copy **everything**,
   paste it into the editor.
3. Click **Run** (or press the green run button).
4. You should see *"Success. No rows returned."* If you see an error, copy it to
   me — but on a fresh project this runs clean.

Verify: sidebar → **Table Editor** should now list `profiles`, `alumni`,
`classes`, `donations`, `events`, `event_rsvps`, `chats`, `chat_members`,
`messages`. Under **Database → Roles/Policies**, RLS is on for all of them.

### 2c. Grab your keys (you'll need these for Vercel)
1. Sidebar → **Project Settings → API**.
2. Copy and keep these three values handy:
   - **Project URL** (looks like `https://xxxx.supabase.co`)
   - **anon / public** key
   - **service_role** key (this one is secret — never shown in the browser app)

### 2d. Auth setting (important, easy to miss)
1. Sidebar → **Authentication → URL Configuration**.
2. Under **Redirect URLs**, add (you'll add the real Vercel URL in Part 3):
   - `http://localhost:3000/auth/callback`
3. Save.

---

## Part 3 — Deploy on Vercel (dashboard only)

1. Go to <https://vercel.com>, sign in **with your GitHub account**.
2. **Add New… → Project**.
3. Find `dmgs-alumni` in the list of your GitHub repos → **Import**.
   (If prompted, give Vercel permission to see the repo.)
4. Vercel auto-detects **Next.js** — leave the build settings as they are.
5. Expand **Environment Variables** and add these four (name → value):

   | Name | Value |
   |------|-------|
   | `NEXT_PUBLIC_SUPABASE_URL` | your Supabase Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your anon/public key |
   | `SUPABASE_SERVICE_ROLE_KEY` | your service_role key |
   | `NEXT_PUBLIC_SITE_URL` | leave blank for now, or put `https://dmgs-alumni.vercel.app` |

6. Click **Deploy**. Wait ~1–2 minutes. You'll get a live URL like
   `https://dmgs-alumni.vercel.app`.

### 3a. Point the app at its real URL
1. Copy your live Vercel URL.
2. Vercel → your project → **Settings → Environment Variables** → set
   `NEXT_PUBLIC_SITE_URL` to that URL (e.g. `https://dmgs-alumni.vercel.app`).
3. Back in **Supabase → Authentication → URL Configuration**, add
   `https://YOUR-VERCEL-URL/auth/callback` to the Redirect URLs, and set the
   **Site URL** to your Vercel URL. Save.
4. In Vercel → **Deployments** → the latest one → **… → Redeploy** so it picks
   up the new variable.

---

## Part 4 — Make yourself the super admin

1. Open your live site → **Request membership** (`/signup`) → sign up with your
   own email. Confirm the email if asked.
2. You'll land on an **"Awaiting approval"** page — that's correct, new members
   start as pending.
3. Supabase → **SQL Editor → New query**, paste and **Run**:

   ```sql
   update public.profiles
   set role = 'super_admin', status = 'approved', approved_at = now()
   where email = 'YOUR-EMAIL-HERE';
   ```
4. Go back to the site, refresh — you're now in as super admin.

To appoint a class admin later (e.g. Class of 1977):

```sql
update public.profiles
set role = 'class_admin', admin_of_year = 1977
where email = 'THEIR-EMAIL';
```

---

## If something breaks

Send me the exact error text (from the Vercel build log, the Supabase SQL
Editor, or the browser). Almost every first-time snag is one of: a missing env
variable, the redirect URL not added in Supabase, or the `service_role` key
accidentally named with a `NEXT_PUBLIC_` prefix (it must **not** have one).
