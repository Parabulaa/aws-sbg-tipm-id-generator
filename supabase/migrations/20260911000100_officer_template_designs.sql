-- Preserve existing category templates as the shared fallback (empty team).
alter table public.templates add column if not exists team text not null default '';
alter table public.templates drop constraint if exists templates_category_side_key;

do $$
begin
  if not exists (
    select 1 from pg_catalog.pg_constraint
    where conrelid = 'public.templates'::regclass
      and conname = 'templates_category_side_team_key'
  ) then
    alter table public.templates
      add constraint templates_category_side_team_key unique (category, side, team);
  end if;

  if not exists (
    select 1 from pg_catalog.pg_constraint
    where conrelid = 'public.templates'::regclass
      and conname = 'templates_officer_team_check'
  ) then
    alter table public.templates
      add constraint templates_officer_team_check check (
        team = '' or (category = 'Officer' and team in (
          'Executive', 'BuildHers+', 'Relations', 'Operations', 'Marketing',
          'Finance', 'Creatives', 'Technology / CTO Office'
        ))
      );
  end if;
end;
$$;
-- Existing admin-only writes and active-officer reads continue under RLS.
