-- ============================================================================
-- DMGS Alumni Platform — 0003 Row Level Security
-- The heart of the access model. Three roles:
--   member       — approved alumni: browse directory, chat, events, OWN donations
--   class_admin   — member + individual donations for their class, aggregate others
--   super_admin   — full access; approves members, manages everything
--
-- Donations are the sensitive surface: individual rows are visible to the class
-- admin of THAT class only; aggregate totals for other classes come from the
-- class_donation_totals() RPC (0002), never from row access.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Column guards. RLS can't easily restrict WHICH columns change, so triggers
-- pin privileged columns unless the actor is a super admin.
-- ---------------------------------------------------------------------------

-- profiles: only super_admin may change role / status / class assignment.
create or replace function public.guard_profile_update()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_super_admin() then
    new.role          := old.role;
    new.status        := old.status;
    new.admin_of_year := old.admin_of_year;
    new.approved_at   := old.approved_at;
    new.approved_by   := old.approved_by;
  end if;
  return new;
end;
$$;

create trigger profiles_guard before update on public.profiles
  for each row execute function public.guard_profile_update();

-- alumni: graduating year is locked to admin-only editing.
create or replace function public.guard_alumni_year()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_super_admin() then
    new.class_year := old.class_year;
  end if;
  return new;
end;
$$;

create trigger alumni_guard before update on public.alumni
  for each row execute function public.guard_alumni_year();

-- ---------------------------------------------------------------------------
-- Enable RLS everywhere
-- ---------------------------------------------------------------------------
alter table public.classes      enable row level security;
alter table public.profiles     enable row level security;
alter table public.alumni       enable row level security;
alter table public.donations    enable row level security;
alter table public.events       enable row level security;
alter table public.event_rsvps  enable row level security;
alter table public.chats        enable row level security;
alter table public.chat_members enable row level security;
alter table public.messages     enable row level security;

-- ===========================================================================
-- profiles
-- ===========================================================================
create policy profiles_select_self_or_admin on public.profiles
  for select using (id = auth.uid() or public.is_super_admin());

-- A user can edit their own profile; the guard trigger blocks privileged cols.
create policy profiles_update_self on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- Super admin can update any profile (approvals, role + class assignment).
create policy profiles_update_admin on public.profiles
  for update using (public.is_super_admin()) with check (public.is_super_admin());

-- ===========================================================================
-- classes
-- ===========================================================================
create policy classes_select_approved on public.classes
  for select using (public.is_approved());

create policy classes_admin_all on public.classes
  for all using (public.is_super_admin()) with check (public.is_super_admin());

-- A class admin may update their own class row (e.g. the giving goal).
create policy classes_update_own on public.classes
  for update using (year = public.admin_year())
  with check (year = public.admin_year());

-- ===========================================================================
-- alumni (directory)
-- ===========================================================================
create policy alumni_select_published on public.alumni
  for select using (
    (public.is_approved() and is_published) or public.is_super_admin()
  );

-- Approved members can create their own directory record (claim/self-add).
create policy alumni_insert_self on public.alumni
  for insert with check (
    public.is_super_admin()
    or (public.is_approved() and profile_id = auth.uid())
  );

-- Edit own record (year is pinned by the guard trigger); super admin edits any.
create policy alumni_update_self on public.alumni
  for update using (profile_id = auth.uid()) with check (profile_id = auth.uid());

create policy alumni_update_admin on public.alumni
  for update using (public.is_super_admin()) with check (public.is_super_admin());

create policy alumni_delete_admin on public.alumni
  for delete using (public.is_super_admin());

-- ===========================================================================
-- donations  *** sensitive ***
-- ===========================================================================
-- SELECT: super admin sees all; class admin sees individual rows for their
-- own class; any approved user sees only their own donations.
create policy donations_select on public.donations
  for select using (
    public.is_super_admin()
    or class_year = public.admin_year()
    or donor_profile_id = auth.uid()
  );

-- A member can record their own (pending) donation; the Paystack webhook runs
-- with the service-role key and bypasses RLS to confirm/insert.
create policy donations_insert_self on public.donations
  for insert with check (
    public.is_super_admin()
    or (public.is_approved() and donor_profile_id = auth.uid())
  );

create policy donations_update_admin on public.donations
  for update using (public.is_super_admin()) with check (public.is_super_admin());

create policy donations_delete_admin on public.donations
  for delete using (public.is_super_admin());

-- ===========================================================================
-- events
-- ===========================================================================
create policy events_select_approved on public.events
  for select using (public.is_approved());

create policy events_admin_all on public.events
  for all using (public.is_super_admin()) with check (public.is_super_admin());

-- ===========================================================================
-- event_rsvps
-- ===========================================================================
create policy rsvps_select_approved on public.event_rsvps
  for select using (public.is_approved());

create policy rsvps_write_self on public.event_rsvps
  for all using (profile_id = auth.uid() or public.is_super_admin())
  with check (
    public.is_super_admin()
    or (public.is_approved() and profile_id = auth.uid())
  );

-- ===========================================================================
-- chats
-- ===========================================================================
create policy chats_select_member on public.chats
  for select using (
    public.is_super_admin()
    or public.is_chat_member(id)
    or (type = 'broadcast' and public.is_approved())
  );

-- Members create direct/group chats; only super admin creates broadcast chats.
create policy chats_insert on public.chats
  for insert with check (
    public.is_approved()
    and created_by = auth.uid()
    and (type <> 'broadcast' or public.is_super_admin())
  );

create policy chats_update_owner on public.chats
  for update using (created_by = auth.uid() or public.is_super_admin())
  with check (created_by = auth.uid() or public.is_super_admin());

create policy chats_delete_owner on public.chats
  for delete using (created_by = auth.uid() or public.is_super_admin());

-- ===========================================================================
-- chat_members
-- ===========================================================================
create policy chat_members_select on public.chat_members
  for select using (
    profile_id = auth.uid()
    or public.is_chat_member(chat_id)
    or public.is_super_admin()
  );

-- Join a chat yourself, or be added by the chat creator / super admin.
create policy chat_members_insert on public.chat_members
  for insert with check (
    public.is_approved()
    and (
      profile_id = auth.uid()
      or public.is_super_admin()
      or exists (
        select 1 from public.chats c
        where c.id = chat_id and c.created_by = auth.uid()
      )
    )
  );

create policy chat_members_delete on public.chat_members
  for delete using (profile_id = auth.uid() or public.is_super_admin());

-- ===========================================================================
-- messages
-- ===========================================================================
create policy messages_select_member on public.messages
  for select using (
    public.is_super_admin()
    or public.is_chat_member(chat_id)
    or exists (
      select 1 from public.chats c
      where c.id = chat_id and c.type = 'broadcast' and public.is_approved()
    )
  );

-- Post in chats you belong to. Broadcast channels are super-admin write only.
create policy messages_insert on public.messages
  for insert with check (
    sender_id = auth.uid()
    and (
      public.is_super_admin()
      or (
        public.is_chat_member(chat_id)
        and not exists (
          select 1 from public.chats c
          where c.id = chat_id and c.type = 'broadcast'
        )
      )
    )
  );

create policy messages_update_own on public.messages
  for update using (sender_id = auth.uid() or public.is_super_admin())
  with check (sender_id = auth.uid() or public.is_super_admin());

create policy messages_delete_own on public.messages
  for delete using (sender_id = auth.uid() or public.is_super_admin());

-- ===========================================================================
-- storage: avatars bucket — public read, write to own {uid}/... folder
-- ===========================================================================
create policy avatars_public_read on storage.objects
  for select using (bucket_id = 'avatars');

create policy avatars_insert_own on storage.objects
  for insert with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy avatars_update_own on storage.objects
  for update using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy avatars_delete_own on storage.objects
  for delete using (
    bucket_id = 'avatars'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_super_admin())
  );
