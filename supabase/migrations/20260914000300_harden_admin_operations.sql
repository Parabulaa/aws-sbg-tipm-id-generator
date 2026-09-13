create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.officer_profiles
    where id = (select auth.uid())
      and is_active
      and (
        role = 'admin'
        or lower(email) = 'mjramba@tip.edu.ph'
      )
  );
$$;

create or replace function public.is_active_officer()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.officer_profiles
    where id = (select auth.uid())
      and is_active
  );
$$;

revoke all on function public.is_admin() from public;
revoke all on function public.is_active_officer() from public;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_active_officer() to authenticated;

update public.officer_profiles
set role = 'admin',
    is_active = true,
    updated_at = now()
where lower(email) = 'mjramba@tip.edu.ph';

update public.officer_profiles
set role = 'officer',
    is_active = true,
    updated_at = now()
where lower(email) in (
  'qjjgleal@tip.edu.ph',
  'maksalgado@tip.edu.ph',
  'chinlin0507@gmail.com'
);

alter table public.activity_logs
add column if not exists target_name text,
add column if not exists details jsonb not null default '{}'::jsonb;

create index if not exists activity_logs_created_at_idx
on public.activity_logs (created_at desc);

create index if not exists activity_logs_user_role_idx
on public.activity_logs (user_role);

drop policy if exists activity_logs_read_admins on public.activity_logs;
create policy activity_logs_read_admins
on public.activity_logs for select to authenticated
using (public.is_admin());

drop policy if exists activity_logs_insert_active_officers on public.activity_logs;
create policy activity_logs_insert_active_officers
on public.activity_logs for insert to authenticated
with check (user_id = auth.uid() and public.is_active_officer());

comment on function public.is_admin()
is 'RLS helper; true for active administrator profiles, including the reserved AWS SBG TIP Manila owner admin.';
