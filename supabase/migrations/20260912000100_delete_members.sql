create or replace function public.delete_members(member_ids uuid[], actor uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  deleted_count integer;
begin
  if actor is distinct from auth.uid() or not public.is_admin() then
    raise exception 'Administrator access required';
  end if;
  if coalesce(array_length(member_ids, 1), 0) < 1 or array_length(member_ids, 1) > 500 then
    raise exception 'Select 1–500 members to delete';
  end if;

  update public.activities set member_id = null where member_id = any(member_ids);
  delete from public.generated_ids where member_id = any(member_ids);
  delete from public.members where id = any(member_ids);
  get diagnostics deleted_count = row_count;

  insert into public.activities (actor_id, action, metadata)
  values (actor, 'members_deleted', jsonb_build_object('message', deleted_count || ' member record(s) deleted'));
  return deleted_count;
end;
$$;

revoke all on function public.delete_members(uuid[], uuid) from public;
grant execute on function public.delete_members(uuid[], uuid) to authenticated;
