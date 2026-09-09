drop policy if exists officer_profiles_read_active on public.officer_profiles;

create policy officer_profiles_read_self_or_admin
on public.officer_profiles for select to authenticated
using (
  public.is_admin()
  or (public.is_active_officer() and id = (select auth.uid()))
);

comment on policy officer_profiles_read_self_or_admin on public.officer_profiles
is 'Officers can read their own profile; active administrators can manage the complete access list.';
