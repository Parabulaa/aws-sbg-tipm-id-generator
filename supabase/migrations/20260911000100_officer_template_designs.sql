-- Preserve existing category templates as the shared fallback (empty team).
alter table public.templates add column team text not null default '';
alter table public.templates drop constraint templates_category_side_key;
alter table public.templates add constraint templates_category_side_team_key unique (category, side, team);
alter table public.templates add constraint templates_officer_team_check check (
  team = '' or (category = 'Officer' and team in (
    'Executive', 'BuildHers+', 'Relations', 'Operations', 'Marketing',
    'Finance', 'Creatives', 'Technology / CTO Office'
  ))
);
-- Existing admin-only writes and active-officer reads continue under RLS.
