-- Keep the owner account protected as an active admin, but do not lock other
-- officer accounts to a fixed role. Access Management must be able to promote
-- and demote officers normally.
update public.officer_profiles
set role = 'admin',
    is_active = true,
    updated_at = now()
where lower(email) = 'mjramba@tip.edu.ph';
