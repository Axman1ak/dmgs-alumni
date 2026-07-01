-- ============================================================================
-- 0009 — open aggregate class totals to all members
-- Per-class totals carry no individual donor detail, so any approved member
-- may see them (to view every class's fundraising progress). Individual rows
-- remain gated by RLS: a member sees donors only for their own class.
-- ============================================================================

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
  if not public.is_approved() then
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
