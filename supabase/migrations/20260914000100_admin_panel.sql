alter table public.officer_profiles
add column if not exists must_change_password boolean not null default false,
add column if not exists password_changed_at timestamptz;

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.officer_profiles(id) on delete set null,
  user_name text not null,
  user_role text not null check (user_role in ('admin', 'officer')),
  action text not null,
  status text not null default 'Success',
  target_user_id uuid references public.officer_profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.activity_logs enable row level security;

grant select, insert on table public.activity_logs to authenticated;

drop policy if exists activity_logs_read_admins on public.activity_logs;
create policy activity_logs_read_admins
on public.activity_logs for select to authenticated
using (public.is_admin());

drop policy if exists activity_logs_insert_active_officers on public.activity_logs;
create policy activity_logs_insert_active_officers
on public.activity_logs for insert to authenticated
with check (user_id = auth.uid() and public.is_officer());
