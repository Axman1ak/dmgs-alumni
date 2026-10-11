-- ============================================================================
-- 0024 — numbers for the public landing page
-- Visitors are not signed in, so they cannot read the alumni table. These two
-- functions return counts only (never names) for the landing page figures and
-- the "Find your class" picker.
-- ============================================================================
create or replace function public.public_register_stats()
returns table (on_register int, classes int)
language sql stable security definer set search_path = public
as $$
  select count(*)::int, count(distinct class_year)::int
  from public.alumni where is_published;
$$;

create or replace function public.public_class_counts()
returns table (class_year int, people int)
language sql stable security definer set search_path = public
as $$
  select class_year, count(*)::int
  from public.alumni
  where is_published and class_year is not null
  group by class_year
  order by class_year;
$$;

grant execute on function public.public_register_stats() to anon, authenticated;
grant execute on function public.public_class_counts() to anon, authenticated;
