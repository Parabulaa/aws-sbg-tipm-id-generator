update public.officer_profiles
set role = 'admin',
    is_active = true,
    updated_at = now()
where lower(email) = 'mjramba@tip.edu.ph';

update public.officer_profiles
set role = 'officer',
    updated_at = now()
where lower(email) in (
  'qjjgleal@tip.edu.ph',
  'maksalgado@tip.edu.ph',
  'chinlin0507@gmail.com'
);
