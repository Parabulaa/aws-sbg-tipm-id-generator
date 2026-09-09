create extension if not exists pgcrypto with schema extensions;

create table public.officer_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text not null default '',
  role text not null default 'officer' check (role in ('admin', 'officer')),
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.app_settings (
  key text primary key,
  value jsonb not null,
  revision integer not null default 1 check (revision > 0),
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);

insert into public.app_settings (key, value) values
  ('aws_sbg_id_prefix', '"AWS-SBG-TIPM"'::jsonb),
  ('id_validity_months', '12'::jsonb),
  ('officer_team_colors', '{"mode":"default","teams":[]}'::jsonb);

create table public.id_counters (
  scope text primary key,
  last_value bigint not null default 0 check (last_value >= 0),
  updated_at timestamptz not null default now()
);

create table public.members (
  id uuid primary key default gen_random_uuid(),
  aws_sbg_id text unique not null,
  full_name text not null check (length(btrim(full_name)) between 1 and 240),
  tip_email text not null check (length(btrim(tip_email)) between 3 and 240),
  student_id_number text not null check (length(btrim(student_id_number)) between 1 and 100),
  program text not null check (length(btrim(program)) between 1 and 240),
  year_level text not null check (length(btrim(year_level)) between 1 and 100),
  membership_type text not null check (membership_type in ('Member', 'Associate', 'Officer')),
  officer_position text,
  team text,
  photo_path text,
  photo_crop_data jsonb not null default '{"x":0.5,"y":0.5,"zoom":1}'::jsonb,
  color_override text check (color_override is null or color_override ~ '^#[0-9A-Fa-f]{6}$'),
  date_issued date,
  valid_until date,
  status text not null default 'Draft' check (status in ('Draft', 'Needs Photo', 'Needs Attention', 'Ready', 'Generated')),
  revision integer not null default 1 check (revision > 0),
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint members_officer_fields check (
    (membership_type = 'Officer' and officer_position is not null and team is not null)
    or (membership_type <> 'Officer' and officer_position is null and team is null)
  )
);

create unique index members_tip_email_active_unique
  on public.members (lower(tip_email)) where archived_at is null;
create unique index members_student_id_active_unique
  on public.members (student_id_number) where archived_at is null;
create index members_active_status_idx on public.members (archived_at, status);
create index members_membership_type_idx on public.members (membership_type);

create table public.templates (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('Member', 'Associate', 'Officer')),
  side text not null check (side in ('front', 'back')),
  image_path text not null,
  layout jsonb not null,
  version uuid not null default gen_random_uuid(),
  approved boolean not null default true,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (category, side)
);

create table public.generated_ids (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id),
  aws_sbg_id text not null,
  member_snapshot jsonb not null,
  membership_type text not null check (membership_type in ('Member', 'Associate', 'Officer')),
  officer_position text,
  team text,
  photo_snapshot text,
  template_versions jsonb not null,
  effective_accent text not null,
  generated_by uuid not null references auth.users(id),
  generated_at timestamptz not null default now(),
  front_path text not null,
  back_path text not null,
  pdf_path text not null
);

create index generated_ids_member_generated_idx
  on public.generated_ids (member_id, generated_at desc);

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id),
  member_id uuid references public.members(id),
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index activities_created_idx on public.activities (created_at desc);
create index activities_member_idx on public.activities (member_id, created_at desc);

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger officer_profiles_touch before update on public.officer_profiles
for each row execute function public.touch_updated_at();
create trigger templates_touch before update on public.templates
for each row execute function public.touch_updated_at();

create or replace function public.create_pending_officer_profile()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.officer_profiles (id, email, display_name)
  values (new.id, coalesce(new.email, ''), coalesce(new.raw_user_meta_data->>'display_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger create_pending_officer_profile
after insert on auth.users for each row
execute function public.create_pending_officer_profile();

comment on table public.members is 'Shared AWS SBG TIP Manila member records. AWS SBG IDs are never reused.';
comment on table public.generated_ids is 'Immutable metadata and member snapshots for saved ID generations.';
