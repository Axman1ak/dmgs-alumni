-- ============================================================================
-- 0008 — members see their own class's donations
-- Adds my_class_year() and widens the donations SELECT policy so a regular
-- member sees every donation for the class they belong to (plus their own
-- gifts). Class admins and super admins are unchanged.
-- ============================================================================

create or replace function public.my_class_year()
returns int
language sql stable security definer set search_path = public
as $$
  select coalesce(
    (select class_year from public.alumni where profile_id = auth.uid() limit 1),
    (select class_year from public.profiles where id = auth.uid())
  );
$$;

drop policy if exists donations_select on public.donations;

create policy donations_select on public.donations
  for select using (
    public.is_super_admin()
    or class_year = public.admin_year()
    or class_year = public.my_class_year()
    or donor_profile_id = auth.uid()
  );
