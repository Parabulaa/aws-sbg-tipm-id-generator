create or replace function public.team_for_officer_position(p_position text)
returns text language sql immutable set search_path = '' as $$
  select case p_position
    when 'LORSO REPRESENTATIVE' then 'Executive'
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


-- Correct existing LORSO records without rewriting saved generated ID snapshots.
update public.members set team = 'Executive'
where membership_type = 'Officer' and officer_position = 'LORSO REPRESENTATIVE'
  and team is distinct from 'Executive';
