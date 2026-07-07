# DMGS Alumni Platform

Community platform for the **Doherty Memorial Grammar School Old Students
Association** (Ijero-Ekiti, Nigeria — est. 1955). Next.js 14 + Supabase, styled
as a warm institutional "archive meets yearbook" portal.

This repo currently contains **Phase 1 — Foundations**: project scaffold, the
full database schema, role-based Row Level Security, and email/password auth
with an admin-approval queue.

## Tech stack

- **Next.js 14** (App Router, Server Actions) — deployed on Vercel
- **Supabase** — Postgres, Auth, Realtime, Storage, Row Level Security
- **Tailwind CSS** — design tokens mirror the HTML prototype
- **Paystack** — payments (Phase 5, not yet wired)

## Getting started

### 1. Install

```bash
npm install
```

### 2. Set up Supabase

Create a project in the Supabase dashboard (same org as MedRev), then link and
push the migrations:

```bash
npm install -g supabase        # if you don't have the CLI
supabase login
supabase link --project-ref <YOUR-PROJECT-REF>
supabase db push               # applies migrations in supabase/migrations
```

`supabase db push` runs `0001_schema` → `0002_functions_triggers` →
`0003_rls`. Then load the class list + seed helpers:

```bash
supabase db execute --file supabase/seed.sql
```

### 3. Environment variables

Copy `.env.example` to `.env.local` and fill in the values from
**Supabase → Project Settings → API**:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...      # server only
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 4. Run

```bash
npm run dev
```

### 5. Create the super admin

Sign up through the app (`/signup`), confirm the email, then promote that
account in the Supabase SQL editor:

```sql
update public.profiles
set role = 'super_admin', status = 'approved', approved_at = now()
where email = 'your-email@example.com';
```

## How the access model works

Three roles, enforced in Postgres via RLS (`supabase/migrations/0003_rls.sql`):

| Role | Directory | Events | Chat | Donations |
|------|-----------|--------|------|-----------|
| **member** | browse | view + RSVP | DM / groups | own history only |
| **class_admin** | browse | view + RSVP | DM / groups | individual rows for **own class**, aggregate totals for others |
| **super_admin** | full CRUD | full CRUD | + broadcast | everything |

Donations are the sensitive surface. A class admin can see individual donor
names and amounts **only for the class they administer**; for every other class
they get aggregate totals via the `class_donation_totals()` RPC, never
row-level access. Regular members see only their own giving.

New signups land in a `pending` state and are held on `/pending` by the
middleware until a super admin approves them.

## Project structure

```
app/
  (auth)/           login, signup, reset-password + server actions
  auth/callback/    email confirmation + reset code exchange
  pending/          holding page for unapproved members
  directory/        approved-member landing (full directory = Phase 2)
  page.tsx          public landing / hero
components/
  layout/           SiteHeader, SiteFooter
  auth/             AuthCard, SubmitButton
  ui/               Crest
lib/supabase/       client (browser), server, admin (service role), middleware
supabase/
  migrations/       0001 schema · 0002 functions/triggers · 0003 RLS
  seed.sql          classes 1955–1990 + bootstrap notes
```

## Roadmap

- **Phase 2** — searchable alumni directory (grid/list, filters, profile modal, self-service editing, photo uploads)
- **Phase 3** — events (create/RSVP/calendar)
- **Phase 4** — real-time messaging (DMs, groups, admin broadcast)
- **Phase 5** — donations + Paystack (checkout, webhooks, class dashboards, PDF reports)
- **Phase 6** — data import, mobile QA, custom domain, handover docs
