-- ============================================================================
-- 0015 — regular members see only aggregate totals + their own gifts
-- Reverses 0008's "members see their own class's donors". Individual donation
-- rows are now visible only to the class admin of that class and super admins.
-- Everyone still sees per-class TOTALS via class_donation_totals().
-- ============================================================================

drop policy if exists donations_select on public.donations;

create policy donations_select on public.donations
  for select using (
    public.is_super_admin()
    or class_year = public.admin_year()   -- class admin: their class's donors
    or donor_profile_id = auth.uid()      -- anyone: their own gifts only
  );
