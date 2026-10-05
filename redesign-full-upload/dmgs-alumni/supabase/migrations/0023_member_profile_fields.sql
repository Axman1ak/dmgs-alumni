-- ============================================================================
-- 0023 — Mike's membership profile fields (Oct 2026)
-- Additive only: the current site keeps working while the redesign is previewed.
--   names:      first_name, last_name, maiden_name, former_name
--   work:       industry, job_title, employer
--   networking: interests[], connect_pref (mentor | network | none)
--   contact:    linkedin_url, social_url, email_shared (email hidden by default)
-- full_name stays as the display name and is kept in sync by the app.
-- ============================================================================

alter table public.alumni
  add column if not exists first_name   text,
  add column if not exists last_name    text,
  add column if not exists maiden_name  text,
  add column if not exists former_name  text,
  add column if not exists industry     text,
  add column if not exists job_title    text,
  add column if not exists employer     text,
  add column if not exists interests    text[] not null default '{}',
  add column if not exists connect_pref text,
  add column if not exists linkedin_url text,
  add column if not exists social_url   text,
  add column if not exists email_shared boolean not null default false;

do $$ begin
  alter table public.alumni
    add constraint alumni_connect_pref_chk check (connect_pref in ('mentor', 'network', 'none'));
exception when duplicate_object then null; end $$;

alter table public.profiles
  add column if not exists first_name  text,
  add column if not exists last_name   text,
  add column if not exists maiden_name text;

-- Backfill names from full_name: the last word is the surname, the rest the
-- first name (the register's own split, e.g. "Opeoluwa O." / "Abosede").
update public.alumni
set first_name = regexp_replace(full_name, '\s+\S+$', ''),
    last_name  = substring(full_name from '(\S+)$')
where first_name is null and full_name ~ '\s';

-- The one register entry with a married name in brackets.
update public.alumni
set first_name = 'Leye', last_name = 'Ajayi', former_name = 'Mrs Ojo'
where full_name = 'Leye Ajayi (Mrs Ojo)';

update public.profiles
set first_name = regexp_replace(full_name, '\s+\S+$', ''),
    last_name  = substring(full_name from '(\S+)$')
where first_name is null and full_name ~ '\s';

-- Sign-up now also captures first / last / maiden name. Older sign-ups that
-- only send full_name still work: the split is derived from it.
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_full  text := coalesce(nullif(new.raw_user_meta_data->>'full_name', ''), split_part(new.email, '@', 1));
  v_first text := nullif(new.raw_user_meta_data->>'first_name', '');
  v_last  text := nullif(new.raw_user_meta_data->>'last_name', '');
begin
  if v_first is null and v_full ~ '\s' then v_first := regexp_replace(v_full, '\s+\S+$', ''); end if;
  if v_last  is null and v_full ~ '\s' then v_last  := substring(v_full from '(\S+)$'); end if;

  insert into public.profiles (
    id, full_name, first_name, last_name, maiden_name, email, occupation, class_year,
    city, state, country, phone, bio, verification_answer, status, role
  )
  values (
    new.id, v_full, v_first, v_last,
    nullif(new.raw_user_meta_data->>'maiden_name', ''),
    new.email,
    nullif(new.raw_user_meta_data->>'occupation', ''),
    (nullif(new.raw_user_meta_data->>'class_year', ''))::int,
    nullif(new.raw_user_meta_data->>'city', ''),
    nullif(new.raw_user_meta_data->>'state', ''),
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

-- Directory read model. Runs with the caller's rights (RLS on alumni still
-- applies) and only reveals an email when its owner chose to share it.
create or replace view public.directory_people
with (security_invoker = true) as
select
  a.id, a.profile_id, a.full_name, a.first_name, a.last_name, a.maiden_name, a.former_name,
  a.class_year, a.country, a.state, a.industry, a.job_title, a.employer, a.interests,
  a.connect_pref, a.linkedin_url, a.social_url, a.photo_url, a.source,
  case when a.email_shared or a.profile_id = auth.uid() then a.email end as email,
  a.email_shared
from public.alumni a
where a.is_published;

grant select on public.directory_people to authenticated;

create index if not exists alumni_last_name_idx on public.alumni (lower(last_name));
create index if not exists alumni_maiden_name_idx on public.alumni (lower(maiden_name));
