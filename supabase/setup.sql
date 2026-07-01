-- ============================================================================
-- DMGS Alumni Platform — ONE-SHOT SETUP SQL
-- Paste this entire file into the Supabase SQL Editor and click RUN.
-- Applies: schema -> functions/triggers -> RLS -> guard fix -> seed data.
-- Safe to run once on a fresh project.
-- ============================================================================

-- ##### 1/5 SCHEMA #####
-- ============================================================================
-- DMGS Alumni Platform — 0001 schema
-- Tables, enums, indexes. RLS is enabled in 0003; helper functions in 0002.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type app_role      as enum ('member', 'class_admin', 'super_admin');
create type member_status as enum ('pending', 'approved', 'rejected');
create type event_format  as enum ('in_person', 'virtual', 'hybrid');
create type event_status  as enum ('scheduled', 'cancelled');
create type rsvp_status   as enum ('going', 'maybe', 'declined');
create type chat_type     as enum ('direct', 'group', 'broadcast');
create type payment_status as enum ('pending', 'success', 'failed');

-- ---------------------------------------------------------------------------
-- classes — one row per graduating year. Holds the class admin + giving goal.
-- ---------------------------------------------------------------------------
create table public.classes (
  year          int primary key check (year between 1955 and 2100),
  label         text not null,                    -- e.g. "Class of '77"
  admin_id      uuid,                              -- FK added after profiles
  donation_goal numeric(14,2) not null default 0,
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- profiles — user account, 1:1 with auth.users. The "users" table.
-- Holds auth-adjacent data: role, approval status, own + administered class.
-- ---------------------------------------------------------------------------
create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  full_name     text not null,
  email         text,
  role          app_role not null default 'member',
  status        member_status not null default 'pending',
  class_year    int references public.classes(year),   -- own graduating year
  admin_of_year int references public.classes(year),   -- class they administer (class_admin)
  approved_at   timestamptz,
  approved_by   uuid references public.profiles(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- classes.admin_id -> profiles (added now that profiles exists)
alter table public.classes
  add constraint classes_admin_fk
  foreign key (admin_id) references public.profiles(id) on delete set null;

create index profiles_status_idx     on public.profiles (status);
create index profiles_class_year_idx on public.profiles (class_year);

-- ---------------------------------------------------------------------------
-- alumni — directory records. May exist WITHOUT a user account (imported data).
-- All descriptive fields are nullable; the UI renders "Not provided".
-- ---------------------------------------------------------------------------
create table public.alumni (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid unique references public.profiles(id) on delete set null,
  full_name   text not null,
  class_year  int references public.classes(year),
  occupation  text,
  city        text,
  country     text,
  phone       text,
  email       text,
  bio         text,
  photo_url   text,
  chapter     text,            -- e.g. 'North America', 'Nigeria', 'UK'
  is_published boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index alumni_class_year_idx on public.alumni (class_year);
create index alumni_country_idx    on public.alumni (country);
create index alumni_name_idx       on public.alumni using gin (to_tsvector('simple', full_name));

-- ---------------------------------------------------------------------------
-- donations — sensitive. Visibility is enforced in 0003 RLS.
-- ---------------------------------------------------------------------------
create table public.donations (
  id                 uuid primary key default gen_random_uuid(),
  donor_profile_id   uuid references public.profiles(id) on delete set null,
  donor_name         text,                          -- snapshot for receipts
  class_year         int references public.classes(year),
  amount             numeric(14,2) not null check (amount > 0),
  currency           text not null default 'NGN',
  is_anonymous       boolean not null default false,
  paystack_reference text unique,
  status             payment_status not null default 'pending',
  created_at         timestamptz not null default now()
);

create index donations_class_year_idx on public.donations (class_year);
create index donations_donor_idx      on public.donations (donor_profile_id);
create index donations_status_idx     on public.donations (status);

-- ---------------------------------------------------------------------------
-- events + RSVPs
-- ---------------------------------------------------------------------------
create table public.events (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  format      event_format not null default 'in_person',
  starts_at   timestamptz not null,
  ends_at     timestamptz,
  location    text,
  zoom_url    text,
  status      event_status not null default 'scheduled',
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);

create index events_starts_at_idx on public.events (starts_at);

create table public.event_rsvps (
  event_id   uuid not null references public.events(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  status     rsvp_status not null default 'going',
  created_at timestamptz not null default now(),
  primary key (event_id, profile_id)
);

-- ---------------------------------------------------------------------------
-- chats / messages — direct, group, and the admin broadcast channel.
-- A "broadcast" is a chat of type 'broadcast': everyone is a member (read),
-- only super_admin may post (enforced in RLS).
-- ---------------------------------------------------------------------------
create table public.chats (
  id         uuid primary key default gen_random_uuid(),
  type       chat_type not null,
  title      text,                                  -- group / broadcast name
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.chat_members (
  chat_id      uuid not null references public.chats(id) on delete cascade,
  profile_id   uuid not null references public.profiles(id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (chat_id, profile_id)
);

create index chat_members_profile_idx on public.chat_members (profile_id);

create table public.messages (
  id         uuid primary key default gen_random_uuid(),
  chat_id    uuid not null references public.chats(id) on delete cascade,
  sender_id  uuid references public.profiles(id) on delete set null,
  body       text not null check (length(trim(body)) > 0),
  created_at timestamptz not null default now()
);

create index messages_chat_created_idx on public.messages (chat_id, created_at);

-- ##### 2/5 FUNCTIONS & TRIGGERS #####
-- ============================================================================
-- DMGS Alumni Platform — 0002 functions & triggers
-- SECURITY DEFINER helpers (bypass RLS, so they never cause policy recursion),
-- new-user provisioning, updated_at maintenance, donations aggregate RPC,
-- and the avatars storage bucket.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Role / status helpers. SECURITY DEFINER + fixed search_path so they read
-- profiles without triggering profiles' own RLS (prevents infinite recursion).
-- ---------------------------------------------------------------------------
create or replace function public.current_role()
returns app_role
language sql stable security definer set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_super_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'super_admin'
  );
$$;

create or replace function public.is_approved()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and status = 'approved'
  );
$$;

-- The graduating year this user administers (null unless class_admin).
create or replace function public.admin_year()
returns int
language sql stable security definer set search_path = public
as $$
  select admin_of_year from public.profiles
  where id = auth.uid() and role = 'class_admin';
$$;

-- Is the current user a member of the given chat?
create or replace function public.is_chat_member(p_chat_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.chat_members
    where chat_id = p_chat_id and profile_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------------
-- New auth user -> create a pending profile automatically.
-- full_name is pulled from the signup metadata (raw_user_meta_data.full_name).
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, status, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    'pending',
    'member'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();
create trigger alumni_touch before update on public.alumni
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Donations aggregate RPC.
-- Class admins must see AGGREGATE totals for every class (but individual rows
-- only for their own class — enforced by RLS on the table). This SECURITY
-- DEFINER function returns per-class sums of SUCCESSFUL donations with no
-- individual detail, and is callable only by class admins and super admins.
-- ---------------------------------------------------------------------------
create or replace function public.class_donation_totals()
returns table (
  class_year   int,
  label        text,
  total_amount numeric,
  donor_count  bigint,
  goal         numeric
)
language plpgsql stable security definer set search_path = public
as $$
begin
  if not (public.is_super_admin() or public.current_role() = 'class_admin') then
    raise exception 'not authorized';
  end if;

  return query
  select c.year,
         c.label,
         coalesce(sum(d.amount) filter (where d.status = 'success'), 0)::numeric,
         count(d.id)  filter (where d.status = 'success'),
         c.donation_goal
  from public.classes c
  left join public.donations d on d.class_year = c.year
  group by c.year, c.label, c.donation_goal
  order by c.year;
end;
$$;

revoke all on function public.class_donation_totals() from public, anon;
grant execute on function public.class_donation_totals() to authenticated;

-- ---------------------------------------------------------------------------
-- Storage: avatars bucket for profile photos (public read).
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- ##### 3/5 ROW LEVEL SECURITY #####
-- ============================================================================
-- DMGS Alumni Platform — 0003 Row Level Security
-- The heart of the access model. Three roles:
--   member       — approved alumni: browse directory, chat, events, OWN donations
--   class_admin   — member + individual donations for their class, aggregate others
--   super_admin   — full access; approves members, manages everything
--
-- Donations are the sensitive surface: individual rows are visible to the class
-- admin of THAT class only; aggregate totals for other classes come from the
-- class_donation_totals() RPC (0002), never from row access.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Column guards. RLS can't easily restrict WHICH columns change, so triggers
-- pin privileged columns unless the actor is a super admin.
-- ---------------------------------------------------------------------------

-- profiles: only super_admin may change role / status / class assignment.
create or replace function public.guard_profile_update()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_super_admin() then
    new.role          := old.role;
    new.status        := old.status;
    new.admin_of_year := old.admin_of_year;
    new.approved_at   := old.approved_at;
    new.approved_by   := old.approved_by;
  end if;
  return new;
end;
$$;

create trigger profiles_guard before update on public.profiles
  for each row execute function public.guard_profile_update();

-- alumni: graduating year is locked to admin-only editing.
create or replace function public.guard_alumni_year()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_super_admin() then
    new.class_year := old.class_year;
  end if;
  return new;
end;
$$;

create trigger alumni_guard before update on public.alumni
  for each row execute function public.guard_alumni_year();

-- ---------------------------------------------------------------------------
-- Enable RLS everywhere
-- ---------------------------------------------------------------------------
alter table public.classes      enable row level security;
alter table public.profiles     enable row level security;
alter table public.alumni       enable row level security;
alter table public.donations    enable row level security;
alter table public.events       enable row level security;
alter table public.event_rsvps  enable row level security;
alter table public.chats        enable row level security;
alter table public.chat_members enable row level security;
alter table public.messages     enable row level security;

-- ===========================================================================
-- profiles
-- ===========================================================================
create policy profiles_select_self_or_admin on public.profiles
  for select using (id = auth.uid() or public.is_super_admin());

-- A user can edit their own profile; the guard trigger blocks privileged cols.
create policy profiles_update_self on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- Super admin can update any profile (approvals, role + class assignment).
create policy profiles_update_admin on public.profiles
  for update using (public.is_super_admin()) with check (public.is_super_admin());

-- ===========================================================================
-- classes
-- ===========================================================================
create policy classes_select_approved on public.classes
  for select using (public.is_approved());

create policy classes_admin_all on public.classes
  for all using (public.is_super_admin()) with check (public.is_super_admin());

-- A class admin may update their own class row (e.g. the giving goal).
create policy classes_update_own on public.classes
  for update using (year = public.admin_year())
  with check (year = public.admin_year());

-- ===========================================================================
-- alumni (directory)
-- ===========================================================================
create policy alumni_select_published on public.alumni
  for select using (
    (public.is_approved() and is_published) or public.is_super_admin()
  );

-- Approved members can create their own directory record (claim/self-add).
create policy alumni_insert_self on public.alumni
  for insert with check (
    public.is_super_admin()
    or (public.is_approved() and profile_id = auth.uid())
  );

-- Edit own record (year is pinned by the guard trigger); super admin edits any.
create policy alumni_update_self on public.alumni
  for update using (profile_id = auth.uid()) with check (profile_id = auth.uid());

create policy alumni_update_admin on public.alumni
  for update using (public.is_super_admin()) with check (public.is_super_admin());

create policy alumni_delete_admin on public.alumni
  for delete using (public.is_super_admin());

-- ===========================================================================
-- donations  *** sensitive ***
-- ===========================================================================
-- SELECT: super admin sees all; class admin sees individual rows for their
-- own class; any approved user sees only their own donations.
create policy donations_select on public.donations
  for select using (
    public.is_super_admin()
    or class_year = public.admin_year()
    or donor_profile_id = auth.uid()
  );

-- A member can record their own (pending) donation; the Paystack webhook runs
-- with the service-role key and bypasses RLS to confirm/insert.
create policy donations_insert_self on public.donations
  for insert with check (
    public.is_super_admin()
    or (public.is_approved() and donor_profile_id = auth.uid())
  );

create policy donations_update_admin on public.donations
  for update using (public.is_super_admin()) with check (public.is_super_admin());

create policy donations_delete_admin on public.donations
  for delete using (public.is_super_admin());

-- ===========================================================================
-- events
-- ===========================================================================
create policy events_select_approved on public.events
  for select using (public.is_approved());

create policy events_admin_all on public.events
  for all using (public.is_super_admin()) with check (public.is_super_admin());

-- ===========================================================================
-- event_rsvps
-- ===========================================================================
create policy rsvps_select_approved on public.event_rsvps
  for select using (public.is_approved());

create policy rsvps_write_self on public.event_rsvps
  for all using (profile_id = auth.uid() or public.is_super_admin())
  with check (
    public.is_super_admin()
    or (public.is_approved() and profile_id = auth.uid())
  );

-- ===========================================================================
-- chats
-- ===========================================================================
create policy chats_select_member on public.chats
  for select using (
    public.is_super_admin()
    or public.is_chat_member(id)
    or (type = 'broadcast' and public.is_approved())
  );

-- Members create direct/group chats; only super admin creates broadcast chats.
create policy chats_insert on public.chats
  for insert with check (
    public.is_approved()
    and created_by = auth.uid()
    and (type <> 'broadcast' or public.is_super_admin())
  );

create policy chats_update_owner on public.chats
  for update using (created_by = auth.uid() or public.is_super_admin())
  with check (created_by = auth.uid() or public.is_super_admin());

create policy chats_delete_owner on public.chats
  for delete using (created_by = auth.uid() or public.is_super_admin());

-- ===========================================================================
-- chat_members
-- ===========================================================================
create policy chat_members_select on public.chat_members
  for select using (
    profile_id = auth.uid()
    or public.is_chat_member(chat_id)
    or public.is_super_admin()
  );

-- Join a chat yourself, or be added by the chat creator / super admin.
create policy chat_members_insert on public.chat_members
  for insert with check (
    public.is_approved()
    and (
      profile_id = auth.uid()
      or public.is_super_admin()
      or exists (
        select 1 from public.chats c
        where c.id = chat_id and c.created_by = auth.uid()
      )
    )
  );

create policy chat_members_delete on public.chat_members
  for delete using (profile_id = auth.uid() or public.is_super_admin());

-- ===========================================================================
-- messages
-- ===========================================================================
create policy messages_select_member on public.messages
  for select using (
    public.is_super_admin()
    or public.is_chat_member(chat_id)
    or exists (
      select 1 from public.chats c
      where c.id = chat_id and c.type = 'broadcast' and public.is_approved()
    )
  );

-- Post in chats you belong to. Broadcast channels are super-admin write only.
create policy messages_insert on public.messages
  for insert with check (
    sender_id = auth.uid()
    and (
      public.is_super_admin()
      or (
        public.is_chat_member(chat_id)
        and not exists (
          select 1 from public.chats c
          where c.id = chat_id and c.type = 'broadcast'
        )
      )
    )
  );

create policy messages_update_own on public.messages
  for update using (sender_id = auth.uid() or public.is_super_admin())
  with check (sender_id = auth.uid() or public.is_super_admin());

create policy messages_delete_own on public.messages
  for delete using (sender_id = auth.uid() or public.is_super_admin());

-- ===========================================================================
-- storage: avatars bucket — public read, write to own {uid}/... folder
-- ===========================================================================
create policy avatars_public_read on storage.objects
  for select using (bucket_id = 'avatars');

create policy avatars_insert_own on storage.objects
  for insert with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy avatars_update_own on storage.objects
  for update using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy avatars_delete_own on storage.objects
  for delete using (
    bucket_id = 'avatars'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_super_admin())
  );

-- ##### 4/5 GUARD BOOTSTRAP FIX #####
-- ============================================================================
-- 0004 — fix the column guards so they don't trap the super-admin bootstrap.
--
-- The original guards reset privileged columns whenever the actor was "not a
-- super admin". But direct SQL (SQL editor), the service-role key, and backend
-- jobs have no auth.uid(), so is_super_admin() is false there too — which meant
-- the FIRST super admin could never be promoted, and service-role admin
-- approvals / bulk imports were silently reverted.
--
-- Fix: only pin privileged columns for an ACTUAL logged-in non-super-admin
-- (auth.uid() is not null). Null-uid contexts are already privileged and
-- bypass RLS, so trusting them is correct.
-- ============================================================================

create or replace function public.guard_profile_update()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_super_admin() then
    new.role          := old.role;
    new.status        := old.status;
    new.admin_of_year := old.admin_of_year;
    new.approved_at   := old.approved_at;
    new.approved_by   := old.approved_by;
  end if;
  return new;
end;
$$;

create or replace function public.guard_alumni_year()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_super_admin() then
    new.class_year := old.class_year;
  end if;
  return new;
end;
$$;

-- ##### 5/5 SEED (classes 1955-1990) #####
-- ============================================================================
-- Seed data. Runs on `supabase db reset`. Safe to run repeatedly.
-- ============================================================================

-- Graduating classes 1955..1990 (existing imported data spans 1965–1982).
insert into public.classes (year, label)
select y, 'Class of ''' || lpad((y % 100)::text, 2, '0')
from generate_series(1955, 1990) as y
on conflict (year) do nothing;

-- ----------------------------------------------------------------------------
-- BOOTSTRAP THE SUPER ADMIN (run manually once, after that account signs up):
--
--   update public.profiles
--   set role = 'super_admin', status = 'approved', approved_at = now()
--   where email = 'YOUR-SUPER-ADMIN-EMAIL';
--
-- To appoint a class admin for, say, the Class of 1977:
--
--   update public.profiles
--   set role = 'class_admin', admin_of_year = 1977
--   where email = 'CLASS-ADMIN-EMAIL';
--   update public.classes set admin_id = (
--     select id from public.profiles where email = 'CLASS-ADMIN-EMAIL'
--   ) where year = 1977;
-- ----------------------------------------------------------------------------
