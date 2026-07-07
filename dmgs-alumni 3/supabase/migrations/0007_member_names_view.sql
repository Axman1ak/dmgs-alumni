-- ============================================================================
-- 0007 — member_names view
-- Members must see each other's names to start conversations and render chat
-- participants, but profiles RLS hides other members' rows (email, status).
-- This view surfaces only id, full_name, role for approved members, and only
-- to approved callers. Owned by postgres, so it reads profiles past RLS while
-- exposing nothing sensitive.
-- ============================================================================

create or replace view public.member_names as
select id, full_name, role
from public.profiles
where status = 'approved' and public.is_approved();

grant select on public.member_names to authenticated;
