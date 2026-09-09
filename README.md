# AWS SBG TIP Manila ID Generator

Production-oriented member review and ID generation for the AWS Student Builder Group at the Technological Institute of the Philippines – Manila.

## Tech stack

- React 19 and TypeScript
- Tailwind CSS and shadcn/ui components
- Vinext on Vite, targeting the existing Cloudflare/Sites runtime
- Supabase Auth, PostgreSQL, Row-Level Security, and private Storage
- ExcelJS for XLSX parsing
- Canvas for fixed 1200 × 1950 PNG rendering
- pdf-lib for two-page PDFs and JSZip for bulk ZIP export
- Node test runner and Playwright with Microsoft Edge

## Implemented workflow

Public Home → Officer Login → Dashboard → five-field XLSX import or manual member creation → automatic AWS SBG ID assignment → member review → manual photo upload/crop → front/back verification → confirmation → individual/selected/bulk generation → PNG/PDF/ZIP export → immutable generation history.

The application supports Member, Associate, and Officer classifications; controlled officer positions; automatic team/office derivation; configurable administrator-managed officer colors; Draft, Needs Photo, Needs Attention, Ready, and Generated statuses; Save & Next; archive/administrator restore; actor-aware activity; and real shared dashboard metrics.

It starts with no members, history, or mock application data. New IDs use the
`AWSSBG-TIPM-YY###` format (for example, `AWSSBG-TIPM-26001` for the first ID
assigned in 2026). Sequence values are allocated in import order, so import
the 19 officers first when officers must occupy `001`–`019`; member IDs then
continue at `020`.

## Local setup

Requires Node.js 22.13 or newer and a Supabase project.

```sh
npm install
copy .env.example .env.local
npm run dev
```

Fill `.env.local`, apply the checked-in Supabase migrations, and create the first administrator as described in [Supabase setup](docs/SUPABASE_SETUP.md). Open http://localhost:3000.

If upgrading an existing deployment, apply the latest migration
(`20260910000100_awscc_id_format.sql` and the later prefix-normalization
migration) before importing new members. Existing IDs are preserved; only
newly allocated IDs use the AWSSBG format.

## Required organization assets

Generation requires approved front/back 1200 × 1950 PNGs for Member, Officer, and Associate plus their mapping JSON. These assets were not supplied and are intentionally not replaced with fabricated designs. See [Template setup](docs/TEMPLATE_SETUP.md).

## Verification

```sh
npm test
npm run test:e2e
npm run typecheck
npm run lint
npm run build
```

Browser tests use isolated in-process fixtures and never write to a linked Supabase project. See [Validation](docs/VALIDATION.md) and [Development](docs/DEVELOPMENT.md).
