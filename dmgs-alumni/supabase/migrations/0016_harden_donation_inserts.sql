-- ============================================================================
-- 0016 — harden donation inserts
--
-- Donation rows are written from the browser with the anon key. Before this,
-- the INSERT policy only checked "are you approved", so a member could insert
-- a row with status='success', an arbitrary amount, an arbitrary class_year,
-- and an arbitrary donor_name — forging a fully-paid gift with NO payment, and
-- crediting it to any class. class_donation_totals() and the printed reports
-- count status='success', so a forged row instantly inflates totals.
--
-- This BEFORE INSERT trigger pins the sensitive columns to trusted,
-- server-derived values for everyone except a super admin (who may record
-- manual/offline gifts). Only the signature-verified Paystack webhook, running
-- as the service role via UPDATE, may ever move a donation to 'success'.
-- ============================================================================

create or replace function public.guard_donation_insert()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_name text;
begin
  -- Super admins may enter donations manually with full control.
  if public.is_super_admin() then
    return new;
  end if;

  -- Everyone else: pin the sensitive columns to server-derived values.
  new.donor_profile_id := auth.uid();
  new.status           := 'pending';            -- only the webhook may set 'success'
  new.class_year       := public.my_class_year();

  select full_name into v_name from public.profiles where id = auth.uid();
  new.donor_name := v_name;                      -- snapshot; display honors is_anonymous

  if new.amount is null or new.amount <= 0 or new.amount > 100000000 then
    raise exception 'Donation amount is out of range.';
  end if;

  return new;
end;
$$;

revoke all on function public.guard_donation_insert() from public, anon;

drop trigger if exists guard_donation_insert on public.donations;
create trigger guard_donation_insert
  before insert on public.donations
  for each row execute function public.guard_donation_insert();

-- Defense in depth: the INSERT policy also forbids a non-super-admin from
-- naming 'success' directly (the trigger already forces 'pending').
drop policy if exists donations_insert_self on public.donations;
create policy donations_insert_self on public.donations
  for insert with check (
    public.is_super_admin()
    or (
      public.is_approved()
      and donor_profile_id = auth.uid()
      and status = 'pending'
    )
  );
