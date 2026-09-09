alter table public.members drop constraint if exists members_officer_fields;
alter table public.members add constraint members_officer_fields check (
  (
    membership_type = 'Officer'
    and (
      (officer_position is null and team is null)
      or (officer_position is not null and team is not null)
    )
  )
  or (membership_type <> 'Officer' and officer_position is null and team is null)
);

grant insert on table public.activities to authenticated;
create policy activities_insert_active_officers
on public.activities for insert to authenticated
with check (
  public.is_active_officer()
  and actor_id = (select auth.uid())
);

create or replace function public.create_members(
  member_rows jsonb,
  actor uuid,
  action_name text default 'member_imported'
)
returns setof public.members
language plpgsql
security definer
set search_path = ''
as $$
declare
  item jsonb;
  item_count integer;
  year_scope text := extract(year from now())::integer::text;
  prefix text;
  first_value bigint;
  offset_value bigint := 0;
  created public.members;
begin
  if actor <> (select auth.uid()) or not public.is_active_officer() then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  if jsonb_typeof(member_rows) <> 'array' then
    raise exception 'member_rows must be an array' using errcode = '22023';
  end if;
  item_count := jsonb_array_length(member_rows);
  if item_count < 1 or item_count > 500 then
    raise exception 'create between 1 and 500 members' using errcode = '22023';
  end if;
  select value #>> '{}' into prefix
  from public.app_settings where key = 'aws_sbg_id_prefix';
  if prefix is null or btrim(prefix) = '' then prefix := 'AWS-SBG-TIPM'; end if;

  insert into public.id_counters (scope, last_value)
  values (year_scope, 0)
  on conflict (scope) do nothing;
  select last_value + 1 into first_value
  from public.id_counters where scope = year_scope for update;
  update public.id_counters
  set last_value = last_value + item_count, updated_at = now()
  where scope = year_scope;

  for item in select value from jsonb_array_elements(member_rows)
  loop
    insert into public.members (
      aws_sbg_id, full_name, tip_email, student_id_number, program,
      year_level, membership_type, officer_position, team, status,
      created_by, updated_by
    ) values (
      prefix || '-' || year_scope || '-' || lpad((first_value + offset_value)::text, 4, '0'),
      btrim(item->>'full_name'),
      lower(btrim(item->>'tip_email')),
      btrim(item->>'student_id_number'),
      btrim(item->>'program'),
      btrim(item->>'year_level'),
      item->>'membership_type',
      case when item->>'membership_type' = 'Officer'
        then nullif(btrim(item->>'officer_position'), '') else null end,
      case when item->>'membership_type' = 'Officer'
        then nullif(btrim(item->>'team'), '') else null end,
      'Draft',
      actor,
      actor
    )
    returning * into created;

    insert into public.activities (actor_id, member_id, action, metadata)
    values (
      actor,
      created.id,
      action_name,
      jsonb_build_object(
        'message',
        case when action_name = 'member_created'
          then 'Member created: ' else 'Member imported: ' end || created.full_name,
        'aws_sbg_id',
        created.aws_sbg_id
      )
    );
    offset_value := offset_value + 1;
    return next created;
  end loop;
end;
$$;

revoke all on function public.create_members(jsonb, uuid, text) from public;
grant execute on function public.create_members(jsonb, uuid, text) to authenticated;

create or replace function public.record_generation(
  generation_id uuid,
  member_uuid uuid,
  expected_revision integer,
  actor uuid,
  snapshot jsonb,
  template_version_map jsonb,
  accent text,
  photo_reference text,
  front_file_path text,
  back_file_path text,
  pdf_file_path text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_member public.members;
  generated_time timestamptz := now();
  previous_count bigint;
begin
  if actor <> (select auth.uid()) or not public.is_active_officer() then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  select * into current_member from public.members
  where id = member_uuid for update;
  if not found then raise exception 'member not found' using errcode = 'P0002'; end if;
  if current_member.archived_at is not null then
    raise exception 'archived members cannot generate IDs' using errcode = '22023';
  end if;
  if current_member.revision <> expected_revision or current_member.status <> 'Ready' then
    raise exception 'member changed during generation' using errcode = '40001';
  end if;
  select count(*) into previous_count from public.generated_ids
  where member_id = member_uuid;
  insert into public.generated_ids (
    id, member_id, aws_sbg_id, member_snapshot, membership_type,
    officer_position, team, photo_snapshot, template_versions,
    effective_accent, generated_by, generated_at, front_path, back_path, pdf_path
  ) values (
    generation_id, current_member.id, current_member.aws_sbg_id, snapshot,
    current_member.membership_type, current_member.officer_position,
    current_member.team, photo_reference, template_version_map, accent,
    actor, generated_time, front_file_path, back_file_path, pdf_file_path
  );
  update public.members set
    status = 'Generated',
    revision = revision + 1,
    updated_by = actor,
    updated_at = generated_time
  where id = member_uuid;
  insert into public.activities (actor_id, member_id, action, metadata)
  values (
    actor,
    member_uuid,
    case when previous_count > 0 then 'id_regenerated' else 'id_generated' end,
    jsonb_build_object(
      'message',
      case when previous_count > 0 then 'ID regenerated: ' else 'ID generated: ' end
        || current_member.aws_sbg_id
    )
  );
  return jsonb_build_object('generated_at', generated_time);
end;
$$;

revoke all on function public.record_generation(
  uuid, uuid, integer, uuid, jsonb, jsonb, text, text, text, text, text
) from public;
grant execute on function public.record_generation(
  uuid, uuid, integer, uuid, jsonb, jsonb, text, text, text, text, text
) to authenticated;
