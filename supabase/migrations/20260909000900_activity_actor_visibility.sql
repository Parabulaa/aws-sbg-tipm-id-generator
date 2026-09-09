drop policy if exists officer_profiles_read_self_or_admin on public.officer_profiles;

create policy officer_profiles_read_active_team
on public.officer_profiles for select to authenticated
using (public.is_active_officer());

comment on policy officer_profiles_read_active_team on public.officer_profiles
is 'Active officers can resolve colleague names in the shared activity and generation history; only admins retain write access.';
