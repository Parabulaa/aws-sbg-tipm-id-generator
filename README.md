# AWS SBG TIP Manila ID Generator

An internal member review and ID production application for the AWS Student Builder Group at the Technological Institute of the Philippines – Manila.

## Technology

- React 19, TypeScript, Tailwind CSS
- Existing Vinext / Vite application and responsive navigation
- Cloudflare D1 (SQLite) and R2, with persistent local development storage
- ExcelJS for XLSX parsing and validation
- Canvas for deterministic 1200 × 1950 PNG rendering
- pdf-lib for two-page front/back PDFs; JSZip for grouped bulk downloads
- Node test runner and Playwright browser tests

## Local setup

Requires Node.js 22.13 or newer.

```sh
npm install
npm run db:migrate
npm run dev
```

Open http://localhost:3000. Records and files persist in `.wrangler/state`. The system begins empty and contains no sample members.

## Workflow

Import XLSX → inspect validation report → confirm valid rows → review/edit member → upload and position photo → verify front/back → confirm Ready → Save & Next → generate individually or in batches → download PNG, PDF, or ZIP.

Members can also be added manually. The directory supports search, category/team/status filters, selection, and bulk generation. Dashboard metrics and activity come from saved data. Generated history retains immutable member snapshots and front/back/PDF outputs.

## Template requirement

The six approved Canva backgrounds and their field coordinates were not provided with the specification. Generation requires a configured approved front/back pair for the selected membership category. Add PNGs and coordinate mapping JSON through Templates when the assets are supplied. No replacement designs or fake member data are shipped.

See [Template setup](docs/TEMPLATE_SETUP.md) for requirements.

## Access and deployment preparation

Local development runs as Local officer. An online production build requires allowlisted officer credentials and a session secret, plus deployed D1/R2 bindings and applied migrations; it fails closed if access is unconfigured.

This development phase does not deploy the application or provision an external Supabase project. See [Development and operation](docs/DEVELOPMENT.md) for persistence, credential configuration, limits, and generation behavior.

## Verification

```sh
npm test
npm run typecheck
npm run lint
npm run test:e2e
npm run build
```

Stop the regular dev server before browser tests. They use Microsoft Edge and isolated D1/R2 storage on port 3100. Test-only records are never added to the regular member database.
