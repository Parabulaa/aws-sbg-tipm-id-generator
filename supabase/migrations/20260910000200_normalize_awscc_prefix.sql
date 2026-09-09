-- Normalize legacy/custom prefixes to the approved AWSCC-TIPM format.
-- IDs already assigned remain immutable; this affects future allocations.

update public.app_settings
set value = '"AWSCC-TIPM"'::jsonb,
    revision = revision + 1,
    updated_at = now()
where key = 'aws_sbg_id_prefix'
  and value #>> '{}' <> 'AWSCC-TIPM';
