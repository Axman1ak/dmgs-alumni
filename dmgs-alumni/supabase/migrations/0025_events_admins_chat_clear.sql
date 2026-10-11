-- 0025 — Event management for class admins, attendee list RPC, and
-- per-member "delete conversation" + working read receipts for chats.
-- Additive only: safe to run while the old site is live.

-- Super admins and class admins can create, edit and cancel events.
create or replace function public.is_event_manager()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and status = 'approved' and role in ('super_admin', 'class_admin')
  );
$$;

-- Added alongside the existing events_admin_all (super admins); policies
-- are OR-ed, so class admins now manage events too.
create policy events_manage on public.events
  for all using (public.is_event_manager()) with check (public.is_event_manager());

-- Who is coming to an event (names, class, email), for event managers only.
create or replace function public.event_attendees(p_event uuid)
returns table (name text, class_year int, email text)
language plpgsql stable security definer set search_path = public
as $$
begin
  if not public.is_event_manager() then
    raise exception 'Not authorized.';
  end if;
  return query
    select p.full_name::text, p.class_year, p.email::text
    from public.event_rsvps r
    join public.profiles p on p.id = r.profile_id
    where r.event_id = p_event
    order by p.full_name;
end;
$$;
revoke all on function public.event_attendees(uuid) from public, anon;
grant execute on function public.event_attendees(uuid) to authenticated;

-- Chats: a member can hide a conversation for themselves. Messages before
-- cleared_at stay hidden for them; the other person keeps the history, and a
-- new message brings the conversation back.
alter table public.chat_members add column if not exists cleared_at timestamptz;

-- There is no UPDATE policy on chat_members (so a member can't move
-- themselves into another chat). These two RPCs update only the caller's own
-- row and only these columns.
create or replace function public.mark_chat_read(p_chat uuid)
returns void
language sql security definer set search_path = public
as $$
  update public.chat_members set last_read_at = now()
  where chat_id = p_chat and profile_id = auth.uid();
$$;

create or replace function public.clear_chat(p_chat uuid)
returns void
language sql security definer set search_path = public
as $$
  update public.chat_members set cleared_at = now(), last_read_at = now()
  where chat_id = p_chat and profile_id = auth.uid();
$$;

revoke all on function public.mark_chat_read(uuid) from public, anon;
revoke all on function public.clear_chat(uuid) from public, anon;
grant execute on function public.mark_chat_read(uuid) to authenticated;
grant execute on function public.clear_chat(uuid) to authenticated;
