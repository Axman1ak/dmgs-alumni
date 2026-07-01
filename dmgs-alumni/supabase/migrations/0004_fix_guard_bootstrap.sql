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
