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
