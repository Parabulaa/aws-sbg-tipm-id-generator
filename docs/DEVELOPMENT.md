# Development and operation

The application keeps the existing React, TypeScript, Tailwind, and Vinext/Vite structure. The runtime already uses Cloudflare Workers, so persistence uses D1 (SQLite) for members, review state, configuration, activity, and generation metadata, with R2 for photos, approved backgrounds, and generated files. No Supabase project was configured or supplied. No database is seeded with members.

## Run locally

Requires Node 22.13 or newer.

```sh
npm install
npm run db:migrate
npm run dev
```

Open http://localhost:3000. D1 and R2 persist under `.wrangler/state`. Restarting the server or refreshing the page preserves data. Do not delete this directory if it contains real local records; back it up before moving the installation. Local development data does not automatically transfer to an online database.

Only localhost development allows the `Local officer` actor without sign-in. The production build does not enable this bypass. Do not expose the development server as an officer-facing online service.

## Production configuration (development preparation only)

No deployment or production resource creation is performed by these instructions.

- Provision D1 and R2 bindings named `DB` and `FILES` using the target hosting environment.
- Apply the checked-in Drizzle migrations to that database before serving requests.
- Configure `SESSION_SECRET` to a randomly generated secret of at least 32 characters.
- Configure `AUTH_USERS` as a JSON map of allowed officer email addresses to PBKDF2 salt/hash objects.
- Use `node scripts/officer-hash.mjs officer@example.org` with `OFFICER_PASSWORD` in the process environment to create an officer entry. The script never prints the password.
- Serve over HTTPS: session cookies use HttpOnly, Secure, SameSite=Strict, and an eight-hour lifetime.
- Never put credentials in source files or commit `.dev.vars` / `.env` files.
- Unconfigured online installations fail closed. Public registration is not provided.
- Before online release, configure host-level login rate limiting, backups and retention, and have organization officers perform acceptance testing with their real assets. These deployment checks are not completed by local development tests.

`generated_by` identifies the authenticated email, or `Local officer` in local development. This v1 allowlist gives every authorized officer access to the single organization's records. Account removal invalidates subsequent session checks.

## Import and review

1. Open Members and choose an XLSX workbook. The first worksheet must contain headers in row 1.
2. Required columns: `first_name`, `last_name`, `email`, `membership_type`, `aws_sbg_id`, `date_issued`, `valid_until`.
3. Supported optional columns: `middle_name`, `team`, `position`. Officers require both team and position. Photos do not belong in the spreadsheet.
4. Use Member, Officer, or Associate classifications. Use actual Excel dates or YYYY-MM-DD text.
5. Inspect row errors before confirming. Only valid rows are submitted; invalid rows are not silently inserted. Duplicate IDs within the workbook mark every conflicting row invalid. Existing IDs are checked again by the server and by the unique database constraint.
6. Review a member, edit information, upload a JPG/PNG/WebP, reposition/zoom, and Apply the upload. Uploaded bytes are normalized to PNG; the crop is stored with the photo.
7. Save later edits/crop adjustments. Check both sides and Confirm ID. Uploading alone does not mark a member Ready.
8. Save & Next advances through the review queue. The selection menu supports direct navigation.

Workbooks are limited to 500 rows, 10 MB compressed, and 50 MB expanded. Photo uploads are limited to 8 MB and 40 megapixels before browser normalization. Images are normalized to at most 2400 pixels on their longest side.

## Status rules

- Draft: imported or changed, awaiting review.
- Needs Photo: saved valid information without a photo.
- Needs Attention: saved information has validation errors.
- Ready: an officer explicitly confirmed valid information and a saved photo.
- Generated: output bytes were stored successfully and a generation record was saved.

Edits and photo changes invalidate Ready/Generated status. Generation accepts only Ready records. Regenerate asks for renewed confirmation and creates a new immutable history version. Optimistic revision checks reject stale saves or generation attempts rather than overwriting another officer's work.

## Templates and colors

See TEMPLATE_SETUP.md. The six approved Canva backgrounds have not been supplied in this repository. The application intentionally starts with no templates and blocks generation when the relevant approved front/back pair is missing.

Team configuration is persistent. Officer colors are resolved from manual override, enabled team mapping (when team mode is active), then default green. Member amber and Associate purple remain fixed. Only approved accent regions are recolored, using contrast-safe text. Existing generation files do not change when configuration changes.

## Generation and download

Use Generate ID for a confirmed member. In Members, use selection checkboxes, category/team filters, Generate Selected, Generate Ready in Filter, or Generate All Ready. Non-Ready records are skipped. Progress and per-member failures are displayed; successful results remain available if another member fails.

The same Canvas renderer powers previews and exports at exactly 1200 × 1950 pixels. Preview CSS scales the canvas visually. Text wraps and scales within configured bounds; rendering fails visibly instead of clipping values that cannot fit. PDFs contain front and back as two pages, each 288 × 468 PDF points (4 × 6.5 inches, corresponding to 300 pixels per inch).

History stores the member snapshot, actor, accent, template version pair, timestamp, and file references. PNG/PDF downloads use the saved outputs, not a rerender of subsequently edited data. ZIPs group files by Officers, Associates, and Members, with a generation suffix to avoid overwriting regeneration versions. ZIP creation has a 300 MB memory safeguard; use smaller selections for larger exports.

## Checks

```sh
npm test
npm run typecheck
npm run lint
npm run test:e2e
npm run build
```

Close the regular dev server before browser tests: Vinext permits one dev server per checkout. Browser tests use installed Microsoft Edge, port 3100, and a new isolated `.wrangler/e2e-*` storage directory for every run. Test-only records and template assets are never inserted into the regular development database.

The original PROTOTYPE_STATUS.md is a historical record of the first UI prototype. This document describes the subsequent functional-development work.

## Remaining release inputs and dependency advisories

The six approved templates, their field mappings, real membership workbook/photos, and production hosting/account configuration still need organization input. Test fixtures are isolated and are not substitutes for visual approval or officer acceptance testing.

The patched runtime removes the previously reported high-severity advisories. The September 8, 2026 audit still reports six moderate transitive advisories: development tooling through Drizzle Kit/esbuild, and ExcelJS/uuid (two entries in the production-only audit). The uuid advisory concerns buffer-taking v3/v5/v6 APIs, which this application does not call. Do not blindly apply the audit's breaking ExcelJS downgrade. Recheck upstream fixes before release.
