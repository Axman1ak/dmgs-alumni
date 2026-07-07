-- ============================================================================
-- 0014 — capture the full directory profile at sign-up
-- Add city / phone / bio to profiles and copy the whole profile from sign-up
-- metadata, so approval can populate the member's directory listing in full.
-- ============================================================================

alter table public.profiles
  add column if not exists city text,
  add column if not exists phone text,
  add column if not exists bio text;

create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (
    id, full_name, email, occupation, class_year, city, country, phone, bio,
    verification_answer, status, role
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    nullif(new.raw_user_meta_data->>'occupation', ''),
    (nullif(new.raw_user_meta_data->>'class_year', ''))::int,
    nullif(new.raw_user_meta_data->>'city', ''),
    nullif(new.raw_user_meta_data->>'country', ''),
    nullif(new.raw_user_meta_data->>'phone', ''),
    nullif(new.raw_user_meta_data->>'bio', ''),
    nullif(new.raw_user_meta_data->>'verification_answer', ''),
    'pending',
    'member'
  );
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
