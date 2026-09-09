# Development validation — September 9, 2026

## Automated coverage

- Unit tests cover canonical full names, leading-zero student IDs, year-level normalization, required fields, status transitions, controlled officer positions, CTO/AI/ML/Software Engineering mapping, archive state, ID formatting beyond four digits, XLSX header aliases, five-field parsing, workbook and duplicate validation, crop bounds, mappings, colors, and authentication authorization helpers.
- Schema-policy tests inspect every version-controlled migration for RLS, private buckets, Admin-only configuration, archive transition policies, the locked yearly counter, unique IDs, and generation/archive enforcement.
- Playwright runs the isolated happy path: public Home → Officer Login → Dashboard → five-field XLSX → automatic ID → Officer/AI-ML selection → Technology / CTO Office derivation → photo/crop → Confirm → 1200 × 1950 render/generate → shared history → Logout.

The browser test intercepts only its own test run and stores fixtures in memory. It does not use or seed a linked Supabase project.

## Required commands

```sh
npm test
npm run test:e2e
npm run typecheck
npm run lint
npm run build
```

All must pass before release. Local Supabase database execution additionally requires Docker and can be run with `npm run supabase:test:db` after starting the local stack.

On this development machine, `npx supabase status` could not start or inspect a local database because neither Docker nor Podman is installed/on `PATH`. The migration contract is covered statically, but migrations still need execution against a local Docker stack or the intended project during the external setup phase.

## Manual acceptance still required

- Apply migrations to the intended Supabase project and verify Auth/RLS with real Admin and Officer accounts.
- Upload the six approved template PNGs and mapping JSON.
- Test representative real membership rows, names, photos, and authorized browsers.
- Confirm deployment secrets, backups, retention, login abuse controls, and organization acceptance.

The approved assets and external Supabase project were unavailable during local implementation; this is an external setup requirement, not mock data in the application.
