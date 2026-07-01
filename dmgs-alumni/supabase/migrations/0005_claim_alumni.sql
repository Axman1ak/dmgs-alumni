-- ============================================================================
-- 0005 — claim_alumni RPC
-- Lets an approved member link themselves to an existing (unclaimed) alumni
-- listing. RLS can't express "update a row whose profile_id is null to set it
-- to me", so this SECURITY DEFINER function does it with explicit guards:
--   * caller must be approved
--   * caller must not already have a claimed listing
--   * target listing must exist and be unclaimed
-- ============================================================================

create or replace function public.claim_alumni(p_alumni_id uuid)
returns public.alumni
language plpgsql security definer set search_path = public
as $$
declare
  claimed public.alumni;
begin
  if not public.is_approved() then
    raise exception 'Your membership is not approved yet.';
  end if;

  if exists (select 1 from public.alumni where profile_id = auth.uid()) then
    raise exception 'You have already claimed a listing.';
  end if;

  update public.alumni
  set profile_id = auth.uid()
  where id = p_alumni_id and profile_id is null
  returning * into claimed;

  if claimed.id is null then
    raise exception 'That listing is not available to claim.';
  end if;

  return claimed;
end;
$$;

revoke all on function public.claim_alumni(uuid) from public, anon;
grant execute on function public.claim_alumni(uuid) to authenticated;
