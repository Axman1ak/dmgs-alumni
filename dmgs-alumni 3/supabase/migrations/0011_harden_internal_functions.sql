-- ============================================================================
-- 0011 — hardening (from the Supabase security advisor)
-- Internal trigger functions are invoked by triggers, never by clients, so
-- pin their search_path and revoke the EXECUTE grant that exposes them as RPCs.
-- Triggers keep working — they don't depend on role EXECUTE grants.
-- ============================================================================

alter function public.touch_updated_at() set search_path = public;

revoke execute on function public.touch_updated_at() from public, anon, authenticated;
revoke execute on function public.guard_profile_update() from public, anon, authenticated;
revoke execute on function public.guard_alumni_year() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
