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
