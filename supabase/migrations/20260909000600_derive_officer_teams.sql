create or replace function public.team_for_officer_position(p_position text)
returns text language sql immutable set search_path = '' as $$
  select case p_position
    when 'LORSO REPRESENTATIVE' then 'LORSO'
    when 'CHIEF EXECUTIVE OFFICER/LEAD' then 'Executive'
    when 'EXECUTIVE SECRETARY' then 'Executive'
    when 'ASSOCIATE SECRETARY' then 'Executive'
    when 'BUILDHERS+ AMBASSADOR' then 'BuildHers+'
    when 'CHIEF FINANCIAL OFFICER' then 'Finance'
    when 'VICE-CHIEF FINANCIAL OFFICER' then 'Finance'
    when 'CHIEF OPERATIONS OFFICER' then 'Operations'
    when 'VICE-CHIEF OPERATIONS OFFICER' then 'Operations'
    when 'CHIEF MARKETING OFFICER' then 'Marketing'
    when 'VICE-CHIEF MARKETING OFFICER' then 'Marketing'
    when 'CHIEF RELATIONS OFFICER' then 'Relations'
    when 'VICE-CHIEF RELATIONS OFFICER' then 'Relations'
    when 'CHIEF CREATIVES OFFICER' then 'Creatives'
    when 'VICE-CHIEF CREATIVES OFFICER' then 'Creatives'
    when 'CHIEF TECHNOLOGY OFFICER' then 'Technology / CTO Office'
    when 'VICE-CHIEF TECHNOLOGY OFFICER' then 'Technology / CTO Office'
    when 'AI/ML LEAD' then 'Technology / CTO Office'
    when 'SOFTWARE ENGINEERING LEAD' then 'Technology / CTO Office'
    else null
  end;
$$;

create or replace function public.derive_member_team()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.membership_type = 'Officer' then
    new.team := public.team_for_officer_position(new.officer_position);
  else
    new.officer_position := null;
    new.team := null;
  end if;
  return new;
end;
$$;

create trigger members_derive_team
before insert or update of membership_type, officer_position, team
on public.members for each row execute function public.derive_member_team();

comment on function public.team_for_officer_position(text)
is 'Canonical AWS SBG TIP Manila officer position to team/office mapping.';
