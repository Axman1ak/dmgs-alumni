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
