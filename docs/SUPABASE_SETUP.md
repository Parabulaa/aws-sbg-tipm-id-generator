# Supabase setup

All tables, functions, triggers, RLS policies, and private Storage buckets are defined under `supabase/migrations`. Do not recreate application tables manually in the dashboard.

## 1. Create or choose a project

In Supabase, create the project that will hold the organization’s shared beta data. Copy its project URL, publishable key, and server secret key from the project API settings. Never commit these values.

Create `.env.local` from `.env.example`:

```dotenv
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
SUPABASE_SECRET_KEY=YOUR_SERVER_SECRET_KEY
```

Only the two `VITE_` values may reach browser code. Never prefix the secret key with `VITE_`. The current officer-request path uses the publishable key plus each user’s access token; keep the server secret available only to trusted server/setup environments.

## 2. Apply version-controlled migrations

Authenticate the Supabase CLI, link the intended project, review the target, then push migrations:

```sh
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

Do not run `db reset --linked` against a project containing data. Commit migration changes before applying them. Temporary CLI state under `supabase/.temp` and `supabase/.branches` is ignored.

The migrations create three private buckets:

```text
member-photos
id-templates
generated-ids
```

## 3. Create the first administrator

Create/invite the first user in Supabase Auth. New Auth users receive an inactive Officer profile automatically. After confirming the exact Auth user UUID, promote only that account in the SQL editor:

```sql
update public.officer_profiles
set role = 'admin', is_active = true, display_name = 'YOUR DISPLAY NAME'
where id = 'THE_AUTH_USER_UUID';
```

Sign in as that administrator. The Templates page includes Officer access management. Create/invite additional Auth users, then activate them and select Admin or Officer there. Do not enable public sign-up for this internal tool.

## 4. Configure application assets and settings

As Admin:

1. Upload the six approved 1200 × 1950 templates and mappings.
2. Configure optional officer team colors.
3. Keep `aws_sbg_id_prefix` at `AWS-SBG-TIPM` unless the organization explicitly approves a change.
4. Review `id_validity_months` (default 12). This setting is currently stored in `app_settings`; change it through a controlled Admin migration or SQL operation until a dedicated validity UI is added.

## 5. Validate before deployment

Run the required repository checks, then test the real project with isolated non-production acceptance records. Confirm anonymous requests cannot read data, Officer accounts cannot change templates/settings/access, Admin can do so, files are not public, archive/restore rules work, and simultaneous imports do not duplicate IDs.

Configure the same six environment values in the deployment environment. Do not expose the service/secret key in client bundles, logs, screenshots, or repository files.
