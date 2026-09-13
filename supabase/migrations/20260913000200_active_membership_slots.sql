-- Archived rows are historical and must not occupy reusable membership slots.

drop index if exists public.members_membership_slot_unique;
create unique index members_membership_slot_current_unique
  on public.members (membership_year, membership_sequence)
  where archived_at is null
    and membership_year is not null
    and membership_sequence is not null;

alter table public.members drop constraint if exists members_aws_sbg_id_key;
drop index if exists public.members_aws_sbg_id_key;
create unique index if not exists members_aws_sbg_id_current_unique
  on public.members (aws_sbg_id)
  where archived_at is null;

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
  year_value smallint := to_char(now(), 'YY')::smallint;
  next_sequence integer;
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

  perform pg_advisory_xact_lock(
    hashtextextended('awssbg-tipm-membership-' || year_scope, 0)
  );

  for item in select value from jsonb_array_elements(member_rows)
  loop
    if item->>'membership_type' = 'Officer' then
      select candidate into next_sequence
      from generate_series(1, 19) as candidate
      where not exists (
        select 1 from public.members
        where archived_at is null
          and membership_year = year_value
          and membership_sequence = candidate
      )
      order by candidate
      limit 1;
      if next_sequence is null then
        raise exception 'all 19 reserved officer membership IDs are occupied'
          using errcode = '22023';
      end if;
    else
      select candidate into next_sequence
      from generate_series(20, 9999) as candidate
      where not exists (
        select 1 from public.members
        where archived_at is null
          and membership_year = year_value
          and membership_sequence = candidate
      )
      order by candidate
      limit 1;
      if next_sequence is null then
        raise exception 'all member membership IDs for this year are occupied'
          using errcode = '22023';
      end if;
    end if;

    insert into public.members (
      aws_sbg_id, membership_year, membership_sequence,
      full_name, tip_email, student_id_number, program,
      year_level, membership_type, officer_position, team, status,
      created_by, updated_by
    ) values (
      'AWSSBG-TIPM-' || year_scope || lpad(next_sequence::text, 4, '0'),
      year_value, next_sequence,
      btrim(item->>'full_name'), lower(btrim(item->>'tip_email')),
      btrim(item->>'student_id_number'), btrim(item->>'program'),
      btrim(item->>'year_level'), item->>'membership_type',
      case when item->>'membership_type' = 'Officer'
        then nullif(btrim(item->>'officer_position'), '') else null end,
      case when item->>'membership_type' = 'Officer'
        then nullif(btrim(item->>'team'), '') else null end,
      'Draft', actor, actor
    )
    returning * into created;

    insert into public.activities (actor_id, member_id, action, metadata)
    values (
      actor, created.id, action_name,
      jsonb_build_object(
        'message', case when action_name = 'member_created'
          then 'Member created: ' else 'Member imported: ' end || created.full_name,
        'aws_sbg_id', created.aws_sbg_id
      )
    );
    return next created;
  end loop;
end;
$$;

revoke all on function public.create_members(jsonb, uuid, text) from public;
grant execute on function public.create_members(jsonb, uuid, text) to authenticated;
