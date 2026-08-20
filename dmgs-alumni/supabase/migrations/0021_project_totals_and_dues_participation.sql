-- ============================================================================
-- 0021 — read helpers for the redesigned Donations page
--   * project_totals()          — money raised per project (for the carousel)
--   * class_dues_participation() — how many of my class have paid this year
-- Both SECURITY DEFINER so an ordinary member gets the aggregate without any
-- access to individual donation rows.
-- ============================================================================

create or replace function public.project_totals()
returns table (project_id uuid, total numeric)
language plpgsql stable security definer set search_path = public
as $$
begin
  if not public.is_approved() then
    raise exception 'not authorized';
  end if;
  return query
  select d.project_id, coalesce(sum(d.amount), 0)::numeric
  from public.donations d
  where d.status = 'success' and d.kind = 'project' and d.project_id is not null
  group by d.project_id;
end;
$$;

revoke all on function public.project_totals() from public, anon;
grant execute on function public.project_totals() to authenticated;

create or replace function public.class_dues_participation(p_year int)
returns table (member_count int, paid_count int)
language plpgsql stable security definer set search_path = public
as $$
declare
  v_class int := public.my_class_year();
begin
  if not public.is_approved() then
    raise exception 'not authorized';
  end if;
  if v_class is null then
    member_count := 0; paid_count := 0; return next; return;
  end if;
  select count(*)::int into member_count
  from public.profiles
  where class_year = v_class and status = 'approved';

  select count(distinct donor_profile_id)::int into paid_count
  from public.donations
  where kind = 'dues' and status = 'success'
    and period_year = p_year and class_year = v_class;

  return next;
end;
$$;

revoke all on function public.class_dues_participation(int) from public, anon;
grant execute on function public.class_dues_participation(int) to authenticated;
