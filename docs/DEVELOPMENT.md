# Development and operation

## Architecture

The existing React/TypeScript/Tailwind/shadcn/Vinext structure is preserved. Client pages call the authenticated catch-all API. The browser Supabase client owns the officer session and sends its access token; server helpers validate that token and the active `officer_profiles` row before each API operation.

Supabase PostgreSQL stores relational members, officer profiles, settings, template mappings, immutable generation history, activity, and the yearly ID counter. Private Storage buckets hold member photos, approved templates, and generated outputs. D1, R2, Drizzle, the custom password allowlist, and signed session cookie implementation are no longer active.

## Data and access rules

- Normal users have no anonymous application-data access.
- Active Admin and Officer accounts can read and operate the member workflow.
- Only Admin can change approved templates, global team colors, or officer access.
- Officers can archive active members; only Admin can restore archived members through the API and RLS transition rules.
- Stale member writes are rejected by revision checks.
- `create_members` locks the yearly counter and assigns `AWS-SBG-TIPM-YYYY-NNNN` IDs transactionally. Archived IDs are never reused.
- `record_generation` atomically verifies Ready/non-archived state, records an immutable snapshot, updates status, and writes actor-aware activity.

## Member input

The standard XLSX first worksheet has exactly five required organization fields:

```text
Full Name | T.I.P. Email | Student ID number | Department/Program | Year Level
```

Normalized aliases are `full_name`, `tip_email`, `student_id_number`, `program`, and `year_level`. The import screen selects one classification for the batch and reports totals, valid rows, invalid rows, duplicates, and IDs to assign. It never asks for IDs, dates, photos, statuses, or internal fields. Student IDs remain text and retain leading zeroes.

Manual creation uses the same five fields plus Membership Type. Officer Position is a controlled dropdown. Team/Office is read-only and derived centrally; AI/ML Lead, Software Engineering Lead, CTO, and Vice-CTO map to `Technology / CTO Office`.

## Review and generation

Imports create Draft members with null issue/validity dates. Valid information without a photo becomes Needs Photo; invalid information becomes Needs Attention. Photo upload remains manual and normalizes JPG/PNG/WebP to PNG in the browser. Uploading does not confirm. First confirmation assigns the issue date and applies the Admin-configurable `id_validity_months` setting (12 by default). Generation requires Ready status and approved template sides.

Canvas preview and export stay fixed at 1200 × 1950. Individual, selected, filtered-ready, and all-ready generation use the same renderer. Each generation stores new front/back PNGs and a two-page PDF under a unique private path. History downloads use those immutable files; bulk export produces a ZIP.

## Commands

```sh
npm run dev
npm test
npm run test:e2e
npm run typecheck
npm run lint
npm run build
npm run supabase:status
npm run supabase:db:lint
npm run supabase:test:db
```

The last three commands require the Supabase CLI environment (and Docker for local-stack commands). Never run automated fixtures against the shared production project.

## Known external inputs

Code, migrations, policies, private-bucket configuration, tests, and documentation are version-controlled. A project owner must still supply Supabase credentials, apply migrations, activate the first Admin, and upload/approve the six organization templates. No deployment or remote Supabase mutation was performed during development.
