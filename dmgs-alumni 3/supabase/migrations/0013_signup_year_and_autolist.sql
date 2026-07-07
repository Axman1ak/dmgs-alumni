-- ============================================================================
-- 0013 — capture graduating year at sign-up + widen class range
-- The sign-up form now asks for a graduating year (a dropdown of these seeded
-- years, so the FK always holds). On approval, the admin action auto-creates
-- the member's directory listing from their profile (see app/admin/actions.ts).
-- ============================================================================

insert into public.classes (year, label)
select y, 'Class of ''' || lpad((y % 100)::text, 2, '0')
from generate_series(1991, 2020) as y
on conflict (year) do nothing;

create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, occupation, country, class_year, verification_answer, status, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    nullif(new.raw_user_meta_data->>'occupation', ''),
    nullif(new.raw_user_meta_data->>'country', ''),
    (nullif(new.raw_user_meta_data->>'class_year', ''))::int,
    nullif(new.raw_user_meta_data->>'verification_answer', ''),
    'pending',
    'member'
  );
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
