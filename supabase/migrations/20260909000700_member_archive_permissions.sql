drop policy if exists members_update_active_officers on public.members;

create policy members_admin_update
on public.members for update to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy members_officer_update_active_only
on public.members for update to authenticated
using (public.is_active_officer() and archived_at is null)
with check (public.is_active_officer());

comment on policy members_officer_update_active_only on public.members
is 'Officers can edit or archive active members, but only administrators can restore archived members.';
