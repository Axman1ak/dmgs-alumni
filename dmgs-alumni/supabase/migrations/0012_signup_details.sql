-- ============================================================================
-- 0012 — richer sign-up + identity check
-- Store profession, country, and an identity-check answer captured at sign-up
-- (e.g. "who was the senior prefect / head boy in your final year?"). The
-- super admin reviews these in the approval queue before approving a member.
-- ============================================================================

alter table public.profiles
  add column if not exists occupation text,
  add column if not exists country text,
  add column if not exists verification_answer text;

create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, occupation, country, verification_answer, status, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    nullif(new.raw_user_meta_data->>'occupation', ''),
    nullif(new.raw_user_meta_data->>'country', ''),
    nullif(new.raw_user_meta_data->>'verification_answer', ''),
    'pending',
    'member'
  );
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
