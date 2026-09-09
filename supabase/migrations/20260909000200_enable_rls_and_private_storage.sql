create or replace function public.is_active_officer()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.officer_profiles
    where id = (select auth.uid()) and is_active
  );
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.officer_profiles
    where id = (select auth.uid()) and is_active and role = 'admin'
  );
$$;

revoke all on function public.is_active_officer() from public;
revoke all on function public.is_admin() from public;
grant execute on function public.is_active_officer() to authenticated;
grant execute on function public.is_admin() to authenticated;

alter table public.officer_profiles enable row level security;
alter table public.members enable row level security;
alter table public.generated_ids enable row level security;
alter table public.activities enable row level security;
alter table public.app_settings enable row level security;
alter table public.templates enable row level security;
alter table public.id_counters enable row level security;

revoke all on table public.officer_profiles, public.members, public.generated_ids,
  public.activities, public.app_settings, public.templates, public.id_counters
from anon, authenticated;

grant select on table public.officer_profiles, public.members, public.generated_ids,
  public.activities, public.app_settings, public.templates to authenticated;
grant update on table public.members to authenticated;
grant insert, update on table public.officer_profiles to authenticated;
grant insert, update on table public.app_settings, public.templates to authenticated;
grant insert on table public.generated_ids to authenticated;

create policy officer_profiles_read_active
on public.officer_profiles for select to authenticated
using (public.is_active_officer());
create policy officer_profiles_admin_insert
on public.officer_profiles for insert to authenticated
with check (public.is_admin());
create policy officer_profiles_admin_update
on public.officer_profiles for update to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy members_read_active_officers
on public.members for select to authenticated
using (public.is_active_officer());
create policy members_update_active_officers
on public.members for update to authenticated
using (public.is_active_officer()) with check (public.is_active_officer());

create policy generated_ids_read_active_officers
on public.generated_ids for select to authenticated
using (public.is_active_officer());
create policy generated_ids_insert_active_officers
on public.generated_ids for insert to authenticated
with check (public.is_active_officer() and generated_by = (select auth.uid()));

create policy activities_read_active_officers
on public.activities for select to authenticated
using (public.is_active_officer());

create policy settings_read_active_officers
on public.app_settings for select to authenticated
using (public.is_active_officer());
create policy settings_admin_insert
on public.app_settings for insert to authenticated
with check (public.is_admin());
create policy settings_admin_update
on public.app_settings for update to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy templates_read_active_officers
on public.templates for select to authenticated
using (public.is_active_officer());
create policy templates_admin_insert
on public.templates for insert to authenticated
with check (public.is_admin());
create policy templates_admin_update
on public.templates for update to authenticated
using (public.is_admin()) with check (public.is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('member-photos', 'member-photos', false, 8388608, array['image/png']),
  ('id-templates', 'id-templates', false, 12582912, array['image/png']),
  ('generated-ids', 'generated-ids', false, 20971520, array['image/png', 'application/pdf'])
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy storage_active_officer_read
on storage.objects for select to authenticated
using (
  bucket_id in ('member-photos', 'id-templates', 'generated-ids')
  and public.is_active_officer()
);

create policy storage_member_photo_insert
on storage.objects for insert to authenticated
with check (bucket_id = 'member-photos' and public.is_active_officer());
create policy storage_member_photo_delete_own
on storage.objects for delete to authenticated
using (
  bucket_id = 'member-photos' and public.is_active_officer()
  and owner_id = (select auth.uid()::text)
);

create policy storage_generated_insert
on storage.objects for insert to authenticated
with check (bucket_id = 'generated-ids' and public.is_active_officer());

create policy storage_template_admin_insert
on storage.objects for insert to authenticated
with check (bucket_id = 'id-templates' and public.is_admin());
create policy storage_template_admin_update
on storage.objects for update to authenticated
using (bucket_id = 'id-templates' and public.is_admin())
with check (bucket_id = 'id-templates' and public.is_admin());

comment on function public.is_active_officer() is 'RLS helper; true only for active organization officer profiles.';
comment on function public.is_admin() is 'RLS helper; true only for active administrator profiles.';
