-- Finalize the approved organization prefix as AWSSBG-TIPM.
-- Existing IDs are immutable; this only controls future allocations.

update public.app_settings
set value = '"AWSSBG-TIPM"'::jsonb,
    revision = revision + 1,
    updated_at = now()
where key = 'aws_sbg_id_prefix'
  and value #>> '{}' <> 'AWSSBG-TIPM';
