alter table public.activity_logs
add column if not exists actor_user_id uuid references public.officer_profiles(id) on delete set null,
add column if not exists actor_name text,
add column if not exists actor_email text,
add column if not exists actor_role text check (actor_role in ('admin', 'officer')),
add column if not exists category text not null default 'account',
add column if not exists target_type text,
add column if not exists target_id uuid,
add column if not exists description text,
add column if not exists metadata jsonb not null default '{}'::jsonb;

update public.activity_logs
set actor_user_id = coalesce(actor_user_id, user_id),
    actor_name = coalesce(actor_name, user_name),
    actor_role = coalesce(actor_role, user_role),
    target_type = coalesce(target_type, case when target_user_id is not null then 'officer' end),
    target_id = coalesce(target_id, target_user_id),
    description = coalesce(description, action),
    metadata = case
      when metadata = '{}'::jsonb then coalesce(details, '{}'::jsonb)
      else metadata
    end;

create index if not exists activity_logs_actor_user_id_idx
on public.activity_logs (actor_user_id);

create index if not exists activity_logs_category_created_at_idx
on public.activity_logs (category, created_at desc);

create index if not exists activity_logs_action_created_at_idx
on public.activity_logs (action, created_at desc);

comment on column public.activity_logs.metadata
is 'Safe audit metadata only. Credentials, tokens, passwords, and secret keys are prohibited.';
