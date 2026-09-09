-- AWSCC-TIPM IDs use the school-year term and a three-digit sequence:
-- AWSCC-TIPM-26001 (26 = 2026 term, 001 = first assigned ID).
-- Existing IDs are immutable; this affects IDs created after this migration.

update public.app_settings
set value = '"AWSCC-TIPM"'::jsonb,
    updated_at = now()
where key = 'aws_sbg_id_prefix'
  and value #>> '{}' = 'AWS-SBG-TIPM';

alter table public.generated_ids
  alter column back_path drop not null,
  alter column pdf_path drop not null;

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
  year_scope text := to_char(now(), 'YY');
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
  if prefix is null or btrim(prefix) = '' then prefix := 'AWSCC-TIPM'; end if;

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
      prefix || '-' || year_scope || lpad((first_value + offset_value)::text, 3, '0'),
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
