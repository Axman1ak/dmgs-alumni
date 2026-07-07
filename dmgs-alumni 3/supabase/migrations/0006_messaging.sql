-- ============================================================================
-- 0006 — messaging support
--   * enable Supabase Realtime on messages (RLS still governs delivery)
--   * seed the single admin broadcast channel
--   * get_or_create_direct_chat RPC for 1:1 conversations
-- ============================================================================

alter publication supabase_realtime add table public.messages;

insert into public.chats (type, title, created_by)
select 'broadcast', 'Announcements', null
where not exists (select 1 from public.chats where type = 'broadcast');

create or replace function public.get_or_create_direct_chat(p_other uuid)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  me uuid := auth.uid();
  existing uuid;
  new_id uuid;
begin
  if not public.is_approved() then
    raise exception 'Your membership is not approved yet.';
  end if;
  if p_other = me then
    raise exception 'You cannot message yourself.';
  end if;

  select c.id into existing
  from public.chats c
  join public.chat_members m1 on m1.chat_id = c.id and m1.profile_id = me
  join public.chat_members m2 on m2.chat_id = c.id and m2.profile_id = p_other
  where c.type = 'direct'
  limit 1;

  if existing is not null then
    return existing;
  end if;

  insert into public.chats (type, created_by) values ('direct', me)
  returning id into new_id;

  insert into public.chat_members (chat_id, profile_id)
  values (new_id, me), (new_id, p_other);

  return new_id;
end;
$$;

revoke all on function public.get_or_create_direct_chat(uuid) from public, anon;
grant execute on function public.get_or_create_direct_chat(uuid) to authenticated;
