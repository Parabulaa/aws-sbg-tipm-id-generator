# AWS SBG TIP Manila ID Generator

## Complete Feature, Development, and Technical Documentation

**Documentation date:** September 9, 2026  
**Application version:** 0.1.0  
**Documented implementation:** development baseline at commit `36e5cb3`  
**Repository:** https://github.com/Parabulaa/aws-sbg-tipm-id-generator

This document describes the program that is currently implemented, how its parts work together, the technology used, the tests completed, and what still needs to be addressed. It is an implementation overview, not a claim that every production-release requirement has been completed.

## 1. Project Purpose

The AWS Student Builder Group – TIP Manila ID Generator is an internal web application for organization officers to manage member information and produce identification cards.

Its main workflow is:

**Import XLSX → Validate → Review member → Upload and position photo → Verify information and both ID sides → Confirm Ready → Save & Next → Generate → Export**

The system supports Member, Officer, and Associate classifications, with configurable team-based accent colors for officers.

Once the approved templates are configured, routine membership processing does not require source-code editing.

## 2. Current Development Status

The project has progressed beyond the original frontend-only prototype. It now includes persistent member storage, protected backend APIs, real XLSX import, editable member records, photo handling, review statuses, ID rendering, export generation, saved history, and real-data dashboard metrics.

| Area                                                     | Current status                                             |
| -------------------------------------------------------- | ---------------------------------------------------------- |
| Existing React/TypeScript/Tailwind structure             | Preserved and extended                                     |
| Mock member and generated-ID data                        | Removed from the application                               |
| Persistent local database and file storage               | Implemented using local D1/R2                              |
| XLSX parsing, validation, and import                     | Implemented                                                |
| Manual member creation and editing                       | Implemented                                                |
| Photo upload, replacement, removal, and positioning      | Implemented                                                |
| Review queue, confirmation, and Save & Next              | Implemented                                                |
| Membership classifications and officer colors            | Implemented                                                |
| Fixed-size front/back rendering engine                   | Implemented                                                |
| Six actual approved organization templates               | Not supplied or integrated yet                             |
| Individual, selected, filtered, and all-ready generation | Implemented; requires configured templates                 |
| PNG, PDF, and ZIP export                                 | Implemented; verified with isolated test assets            |
| Generated-ID history and dashboard metrics               | Connected to persistent data                               |
| Officer sign-in and protected APIs                       | Implemented; online configuration and verification pending |
| Automated checks and development build                   | Passed in the latest recorded validation                   |
| Deployment and production resources                      | Not completed                                              |
| Officer acceptance testing with real membership data     | Pending                                                    |

**Important:** The application does not ship substitute ID designs. Generation is blocked for a category until its approved front/back template pair is configured. Tests use explicitly isolated fixtures, not production members or approved organization artwork.

## 3. Technology Stack

### 3.1 Application and Runtime

Versions below are the declarations in the current package manifest. A caret (`^`) is a version range; `package-lock.json` records the exact resolved installation.

| Technology                   | Declared version        | Purpose                                                                              |
| ---------------------------- | ----------------------- | ------------------------------------------------------------------------------------ |
| React / React DOM            | 19.2.8                  | Component-based interface and client interaction                                     |
| TypeScript                   | 5.9.3                   | Strict application types and compile-time checks                                     |
| Tailwind CSS                 | 4.2.1                   | Existing responsive styling and utility classes                                      |
| Tailwind PostCSS integration | 4.2.1                   | CSS processing                                                                       |
| Vinext                       | 1.0.0-beta.9            | Existing application framework, routes, server/client rendering, and API integration |
| Vite                         | 8.2.2                   | Development server and production bundling                                           |
| React Server DOM Webpack     | 19.2.8                  | React Server Component support used by the framework                                 |
| Cloudflare Workers           | Runtime target          | Server-side API execution                                                            |
| Cloudflare D1 / SQLite       | Runtime service         | Durable structured records and configuration                                         |
| Cloudflare R2                | Runtime service         | Photos, template backgrounds, and generated files                                    |
| Cloudflare Vite plugin       | 1.54.5                  | Worker integration and local runtime bindings                                        |
| Wrangler                     | 4.129.1                 | Local runtime, D1 migrations, and build-preview tooling                              |
| OpenAI Sites Vite plugin     | 0.2.0                   | Retained project runtime integration                                                 |
| Node.js                      | Minimum 22.13.0         | Local development tooling                                                            |
| npm                          | Project package manager | Dependency installation and scripts                                                  |

The project retains an `app/` directory and `next/*` compatibility imports, but its configured framework is **Vinext/Vite**, not a newly introduced standalone Next.js setup.

Despite the organization's AWS name, the current program does not use an AWS SDK, S3, DynamoDB, or an AWS-hosted backend. Its implemented storage is D1/R2. **Supabase is not integrated:** no Supabase project or credentials were supplied, and persistence was implemented within the existing Worker-compatible runtime.

### 3.2 Data, Rendering, and Export Libraries

| Technology        | Declared version | Purpose                                       |
| ----------------- | ---------------- | --------------------------------------------- |
| Drizzle ORM       | ^0.45.2          | SQLite schema definitions                     |
| Drizzle Kit       | ^0.31.10         | Migration generation                          |
| ExcelJS           | ^4.4.0           | XLSX workbook reading and cell interpretation |
| Browser Canvas 2D | Browser API      | Shared front/back preview and PNG rendering   |
| pdf-lib           | ^1.17.1          | Two-page front/back PDF creation              |
| JSZip             | ^3.10.1          | Grouped bulk ZIP downloads                    |
| Web Crypto        | Runtime API      | Password verification and signed sessions     |

Backend record operations use **prepared D1 SQL queries and transactional batches**. Drizzle defines the schema and migrations; the current request handlers do not use a Drizzle ORM query layer for every operation.

### 3.3 Interface Components and Supporting Packages

The project retains its reusable component catalog and existing styling direction. Installed UI/support packages include:

- `@base-ui/react` 1.7.0, `@shadcn/react` 0.3.0, and `shadcn` 4.18.0.
- `lucide-react` 1.31.0 for icons.
- `class-variance-authority` 0.7.1, `clsx` 2.1.1, and `tailwind-merge` 3.6.0 for class composition.
- `tw-animate-css` 1.4.0.
- `cmdk` 1.1.1, `date-fns` 4.1.0, `embla-carousel-react` 8.5.2, `input-otp` 1.4.2, `react-day-picker` 9.8.1, `react-resizable-panels` 4.5.8, and `recharts` 3.8.0.

These are installed dependencies, not a feature checklist. Their presence does not mean the application implements carousels, OTP login, analytics charts, or every component in the retained catalog. The current dashboard uses real count cards and activity records.

### 3.4 Testing and Development Tools

| Tool                          | Declared version | Role                           |
| ----------------------------- | ---------------- | ------------------------------ |
| Node test runner              | Node built-in    | Unit test execution            |
| tsx                           | ^4.23.13         | Run TypeScript tests           |
| Playwright                    | ^1.63.0          | Browser and API workflow tests |
| Oxlint                        | 1.76.0           | Lint checks                    |
| Oxlint TypeScript integration | 7.0.2001         | Type-aware lint support        |
| Oxfmt                         | 0.61.0           | Source formatting              |
| Cloudflare Workers types      | 5.20260908.1     | Runtime binding types          |
| Vite React plugin             | 6.0.2            | React build tooling            |
| Vite RSC plugin               | 0.5.34           | Server Component build tooling |

Additional type packages are `@types/node` 22.19.19, `@types/react` 19.2.14, and `@types/react-dom` 19.2.3.

## 4. System Architecture

```text
Officer's browser
├── React pages and reusable components
├── XLSX parsing and validation
├── Photo normalization and positioning
└── Canvas rendering → PNG → PDF / ZIP
          │
          │ Same-origin authenticated requests
          ▼
Worker-compatible API routes
├── Session checks and write-origin validation
├── Member validation and revision checks
├── Import, review, and generation persistence
├── D1: members, generation history, activities, settings
└── R2: photos, fixed templates, generated PNG/PDF files
```

- `DataProvider` loads the current session and shared application records, exposes them through React context, and refreshes them after mutations.
- Member information and workflow state are persisted through the API, not treated as browser-only local storage.
- Photo normalization, ID composition, and PDF creation run in the browser.
- The generation API validates readiness, revisions, template/color configuration, and basic output format/dimensions before storing files and history. It does not independently re-render the design on the server.
- ZIP downloads are assembled from previously saved output files.
- Preview and export use the same rendering utility to keep their layout logic aligned.

## 5. Pages and Developed Features

### 5.1 Dashboard — `/`

Implemented metrics:

- Total Members.
- Officers, Associates, and Regular Members.
- Draft, Needs Photo, Needs Attention, Ready, and Generated IDs.
- Expired IDs, based on member validity dates.
- Total saved generation versions in the activity section.

The dashboard also includes real recent activity and a shortcut to import/review members. Empty databases display zero counts and appropriate empty states.

The **Generated IDs metric counts members currently marked Generated**. The number of saved generation versions is separate because a member may have multiple historical generations.

### 5.2 Members — `/members`

Implemented:

- XLSX upload and import summary.
- Manual member creation.
- Search by formatted name, email, AWS SBG ID, or position.
- Membership-type, team, and status filters.
- Individual checkboxes and select-all-visible controls.
- Photo-present/missing indicators.
- Current classification, role/team, validity, and review status.
- Direct Review / Edit ID links.
- Generate Selected, Generate Ready in Filter, and Generate All Ready actions.

Editing is performed in the shared review workspace. Member deletion, automatic renewal, and automatic ID-number assignment are not implemented features.

### 5.3 Review / Generate ID — `/generate-id`

Implemented:

- Current member number and total queue size.
- Searchable review queue and direct member selection.
- Previous and Save & Next navigation.
- Editable member information.
- Upload, replace, remove, reset, zoom, and reposition photo controls.
- Live front/back ID preview when templates are configured.
- Officer color override and reset-to-team-color action.
- Validation feedback and current status.
- Save information and Confirm ID actions.
- Individual generation and regeneration.
- Downloads for the newly generated front PNG, back PNG, and PDF.

Uploading a photo does not mark a member Ready. Confirmation is an explicit officer action after reviewing information, photo placement, and both sides.

Save & Next saves changed information before moving on. An unchanged confirmed member remains Ready. The workspace provides discard confirmations for queue switching/previous navigation and a browser-unload warning for unsaved edits or pending photo uploads; this is not a blanket guarantee against every possible navigation-related loss.

### 5.4 Templates — `/templates`

The page represents six required category/side combinations:

- Member Front and Member Back.
- Officer Front and Officer Back.
- Associate Front and Associate Back.

Implemented capabilities:

- Show whether each approved background is configured.
- Preview a saved background.
- Initial setup form for an approved PNG and JSON coordinate mapping.
- Explicit approval confirmation before saving.
- Persistent officer color mode and configurable team-color entries.

This is not a Canva integration or a full visual template editor. The initial setup form allows installation of fixed assets; ordinary member processing does not involve redesigning them.

**Current external blocker:** the actual six approved Canva backgrounds and mappings have not been supplied.

### 5.5 Generated IDs — `/generated-ids`

Implemented history information:

- Saved member photo and formatted name.
- Membership classification, team, and position.
- AWS SBG ID.
- Generation date and valid-until date.
- Generating officer identity.
- Generation status.

Actions include membership filtering, selection, bulk ZIP download, front/back previews, PNG/PDF download, and returning to the member review workspace for regeneration.

History uses saved member snapshots and output bytes. Later edits to a member, photo, template, or team color do not rewrite already generated files.

## 6. XLSX Import and Validation

### 6.1 Supported Columns

The first worksheet is read, with headers in row 1.

| Column            | Requirement                                          |
| ----------------- | ---------------------------------------------------- |
| `first_name`      | Required                                             |
| `middle_name`     | Optional                                             |
| `last_name`       | Required                                             |
| `email`           | Required and validated                               |
| `membership_type` | Required: Member, Officer, or Associate              |
| `team`            | Required for officers; optional for other categories |
| `position`        | Required for officers; optional for other categories |
| `aws_sbg_id`      | Required and unique                                  |
| `date_issued`     | Required                                             |
| `valid_until`     | Required; must be after issue date                   |

Photos are uploaded manually and are not required inside the spreadsheet.

### 6.2 Processing Rules

- Normalize header casing and spaces/hyphens to the expected column format.
- Trim member text values, normalize email casing, and uppercase AWS SBG IDs.
- Accept supported date cells and ISO date text (`YYYY-MM-DD`).
- Reject unsupported membership values, invalid emails/dates, missing required values, and invalid IDs.
- Require officer team and position.
- Flag formula/error cells instead of silently accepting their calculated values.
- Detect duplicates within the workbook and against existing member IDs.
- Show total, valid, and invalid row counts with row-specific errors.
- Require explicit confirmation before importing valid rows.
- Keep invalid rows out of the database; do not silently insert incomplete records.
- Repeat validation and duplicate checks on the server, backed by a unique database constraint.
- Submit imports transactionally so a rejected batch is not partially inserted.

Imported records begin as **Draft**. An empty form object in the source is only form state, not a seeded member.

## 7. Member Fields and Name Formatting

Each member record supports:

| Field                                    | Purpose                                                     |
| ---------------------------------------- | ----------------------------------------------------------- |
| `id`                                     | Internal unique record identifier                           |
| `first_name`, `middle_name`, `last_name` | Original name components                                    |
| `email`                                  | Member email                                                |
| `membership_type`                        | Member, Officer, or Associate                               |
| `team`, `position`                       | Organization assignment and officer role                    |
| `aws_sbg_id`                             | Unique organization ID number                               |
| `date_issued`, `valid_until`             | ID date values                                              |
| `photo_url`                              | Stored photo object key, or null; not a public external URL |
| `photo_crop_data`                        | Normalized horizontal/vertical position and zoom            |
| `color_override`                         | Optional officer-specific accent color                      |
| `status`                                 | Current workflow state                                      |
| `created_at`, `updated_at`               | Record timestamps                                           |
| `revision`                               | Optimistic concurrency/version counter                      |

Display names use **first name + optional middle initial + last name**. Multiword surnames are retained. If the middle name is missing, no unnecessary period is added. Full original name fields remain stored.

The general member text limit is 240 characters per field. AWS SBG IDs have a narrower 3–80-character rule using letters, numbers, dots, underscores, or hyphens, beginning with a letter or number.

## 8. Review Status Rules

| Status          | Meaning and behavior                                                |
| --------------- | ------------------------------------------------------------------- |
| Draft           | Imported, or valid information with a photo awaiting confirmation   |
| Needs Photo     | Saved valid information without a photo                             |
| Needs Attention | Saved information has validation problems                           |
| Ready           | Officer explicitly confirmed valid information and a saved photo    |
| Generated       | Generated output files and a history record were successfully saved |

Important transition rules:

1. Import creates Draft members.
2. Saving edits recalculates review status and invalidates previous readiness.
3. Uploading/replacing a photo never confirms the member automatically.
4. Removing a photo returns a valid member to Needs Photo; invalid information remains Needs Attention.
5. Confirm ID requires valid data and an existing saved photo.
6. Only Ready records enter normal generation.
7. Regeneration requests renewed confirmation and adds a new history record.
8. Stale revision numbers are rejected rather than overwriting a newer officer's edits.

## 9. Photos, Templates, and Rendering

### 9.1 Manual Photo Handling

- Accept JPG, PNG, and WebP through the browser upload control.
- Decode and normalize uploads to PNG.
- Show the pending photo in the ID preview before applying it.
- Support drag repositioning, horizontal/vertical sliders, zoom, and reset.
- Persist the photo and crop when Apply is used.
- Persist later crop changes through Save information.
- Support replacement and removal.
- Retain earlier stored photos so historical generation snapshots can still reference them.

Crop positions are normalized from 0 to 1; zoom ranges from 1 to 4. The actual ID canvas uses the approved photo rectangle. The small photo-adjustment panel is a control surface, not the final exported frame.

### 9.2 Fixed Templates

- Required background format: PNG at exactly **1200 × 1950 pixels**.
- The background should have blank dynamic text/photo regions to avoid printing over old values.
- Mapping defines photo placement, dynamic text rectangles, and approved colorable accent rectangles.
- Front mappings require photo, name, role, ID, and email regions.
- Additional supported dynamic fields are issue date, validity date, and team.
- Coordinates and region bounds are validated against the fixed canvas size.
- Logos and fixed branding must not be included in recolorable regions.

Current rendering limits are important: dynamic text uses Arial, and accent regions are rectangular. Custom Canva fonts, irregular color masks, and a drag-and-drop layout editor are not implemented. Actual design fidelity must be checked when the approved assets arrive.

### 9.3 Membership and Officer Colors

| Classification | Default color    | Role text              |
| -------------- | ---------------- | ---------------------- |
| Member         | Amber `#f59e0b`  | Member                 |
| Associate      | Purple `#8b5cf6` | Associate Member       |
| Officer        | Green `#10b981`  | Saved officer position |

Officer accent precedence is:

**Per-member override → enabled team mapping when team mode is active → default officer green**

Teams are configurable rather than permanently hard-coded. Each mapping has a name, hex color, and enabled/disabled flag. An officer can reset their override to the assigned team/default behavior. Member and Associate colors remain fixed in the current implementation.

Accent labels and dynamic text boxes fully contained inside accent rectangles use contrast-selected black or white text. This does not replace visual approval of the overall design or guarantee readability for an incorrectly mapped partially overlapping region.

### 9.4 Preview and Long Text

- Front and Back controls select the visible side.
- Preview updates when member values, photo/crop, category, or effective color change.
- CSS scales the preview; the internal canvas dimensions stay fixed.
- Text wraps and scales down within each configured box.
- Names are not automatically replaced with ellipses.
- If text still cannot fit at the permitted minimum font size, rendering fails with an actionable message instead of silently clipping it.

## 10. ID Generation and Exports

### 10.1 Generation Modes

| Action                   | Scope                                                                 |
| ------------------------ | --------------------------------------------------------------------- |
| Generate ID              | Current confirmed Ready member                                        |
| Regenerate ID            | Current Generated member, after renewed confirmation                  |
| Generate Selected        | Ready members among the selected directory records                    |
| Generate Ready in Filter | Ready members matching the active category/team/status/search filters |
| Generate All Ready       | All Ready members, regardless of the current directory filter         |

Category and team batches use filters plus Generate Ready in Filter; they do not require separate templates or separate dedicated buttons for every team.

Batch generation processes members sequentially, shows progress, records individual failures, and keeps successful results available even if another member fails. Generation checks member revisions and template/color versions to reject outdated requests.

The current implementation is a browser-driven batch, not a durable background job queue. Keep the page open until generation or ZIP preparation finishes. Already saved outputs remain in history if the page is later closed.

### 10.2 Output Formats

| Format    | Implemented output                                                 |
| --------- | ------------------------------------------------------------------ |
| Front PNG | Exact 1200 × 1950 raster image                                     |
| Back PNG  | Exact 1200 × 1950 raster image                                     |
| PDF       | One two-page PDF per member: front then back                       |
| ZIP       | Selected saved generations, each with front PNG, back PNG, and PDF |

PDF pages measure 288 × 468 points, or 4 × 6.5 inches, embedding the 1200 × 1950 image at an effective 300 pixels per inch. This is not a multi-card print-sheet/imposition feature.

ZIP organization:

```text
AWS-SBG-IDs/
├── Officers/
├── Associates/
└── Members/
    └── <sanitized-ID>_<sanitized-name>_<generation-suffix>/
        ├── front.png
        ├── back.png
        └── ID.pdf
```

The generation suffix distinguishes regenerated versions. Download names are derived from validated IDs or the shared sanitized name/ID utility; display casing can differ between download controls.

## 11. Persistence and Database Design

### 11.1 D1 Tables

| Table           | Stored information                                                            |
| --------------- | ----------------------------------------------------------------------------- |
| `members`       | Internal ID, unique AWS SBG ID, JSON member payload, status, revision         |
| `generated_ids` | Generation ID, member foreign key, JSON snapshot/metadata, creation timestamp |
| `activities`    | Activity ID, member ID, action message, timestamp                             |
| `settings`      | Configuration key, JSON payload, revision; used for colors and templates      |

Most member fields live inside the JSON payload, rather than each being a separate SQL column. The schema is defined in `db/schema.ts`, with checked-in SQL migrations under `drizzle/`.

Prepared SQL statements bind values. Revision-checked writes prevent stale updates. Member updates and their activity entries are saved together. Import batching bounds SQL parameters while retaining an atomic import operation.

### 11.2 R2 Object Storage

Stored object categories:

- `photos/<member-id>/<unique-file>.png`.
- `templates/<category-side>/<version>.png`.
- `exports/<generation-id>/front.png`.
- `exports/<generation-id>/back.png`.
- `exports/<generation-id>/ID.pdf`.

Generation file paths are derived from the generation ID; they are not separate columns for every file in the current schema. ZIP files are assembled on demand rather than permanently saved to R2.

Generation history records include the member snapshot, actor, accent, template version pair, timestamp, and Generated status. Template version identifiers support consistency checks; there is no user-facing template version-history manager.

### 11.3 Local Versus Online Storage

- Regular development data persists under `.wrangler/state`.
- Browser tests use separate `.wrangler/e2e-*` directories.
- Refreshing the page or restarting the local server does not intentionally reset the database.
- Removing local storage directories can destroy local records and files; back them up before moving or resetting the installation.
- Local persistence is not an online shared database and does not automatically synchronize to a deployment.
- Online use requires configured D1/R2 resources, bindings, and applied migrations.

## 12. API Surface

The catch-all route in `app/api/[...path]/route.ts` dispatches the following intended operations:

| Method     | Endpoint                   | Purpose                                                 |
| ---------- | -------------------------- | ------------------------------------------------------- |
| GET        | `/api/session`             | Current authorized actor                                |
| POST       | `/api/login`               | Verify allowed officer credentials and create a session |
| POST       | `/api/logout`              | Clear the session cookie                                |
| GET        | `/api/members`             | Retrieve member records                                 |
| POST       | `/api/members`             | Manually add validated member records                   |
| POST       | `/api/members/import`      | Import a validated member batch                         |
| PUT        | `/api/members/:id`         | Save fields, crop, and officer override                 |
| POST       | `/api/members/:id/confirm` | Confirm Ready after validation                          |
| POST       | `/api/members/:id/photo`   | Save a normalized photo and crop                        |
| DELETE     | `/api/members/:id/photo`   | Remove the current photo reference                      |
| GET / PUT  | `/api/colors`              | Read or save team-color configuration                   |
| GET / POST | `/api/templates`           | Read or configure approved templates                    |
| GET        | `/api/activity`            | Retrieve recent activity                                |
| GET / POST | `/api/generations`         | Retrieve history or store generated outputs             |
| GET        | `/api/files/:key`          | Read a protected stored file                            |

Data and file routes require authorization. Mutating requests require a matching Origin. The login endpoint necessarily runs before session authorization, but still passes write-origin validation. Revision fields are required for relevant updates and generation operations.

## 13. Authentication and Safety

Implemented:

- Allowlisted officer email/password login for configured online installations.
- PBKDF2-SHA-256 password verification with per-account salts and 100,000 iterations.
- HMAC-SHA-256 signed sessions.
- Eight-hour session lifetime.
- HttpOnly, Secure, SameSite=Strict cookies.
- Server-side authorization for member information and file access.
- Subsequent access rejected after an account is removed from the allowlist.
- Same-origin checks for writes.
- No public self-registration or complex role hierarchy.
- Clear safe API error responses rather than returning raw stack traces to officers.

Local development permits a `Local officer` actor only when the development flag is enabled and the request hostname is localhost/loopback. The production build does not enable that bypass. Do not expose the development server as an online officer service.

All allowed officers share access to the same organization's data. Fine-grained permissions, password-reset flows, MFA, account-management UI, and durable login throttling are not implemented. Host-level rate limiting and other release safeguards remain required before online use.

## 14. Error Handling, Progress, and Responsive UI

The interface reports errors for invalid workbooks/columns, row validation, duplicate IDs, missing templates/photos, image loading or upload failures, stale revisions, generation failures, download failures, and unavailable persistence.

Progress/loading feedback is implemented for initial data loading, workbook processing, importing, saving, uploading, preview rendering, generation, and ZIP/download preparation. Relevant controls are disabled while their operations run.

The existing responsive shell, sidebar, shared cards, page headers, status badges, focus styling, and mobile navigation are retained. Tables use contained horizontal scrolling when needed. The latest recorded browser tests checked all five pages at a 390-pixel mobile viewport; this is not a full accessibility audit or exhaustive device/browser certification.

## 15. Operational Limits

| Area                     | Current limit or behavior                                                                |
| ------------------------ | ---------------------------------------------------------------------------------------- |
| XLSX format              | `.xlsx`; first worksheet, row-1 headers                                                  |
| Import batch             | 1–500 member records                                                                     |
| Workbook size            | 10 MB compressed; 50 MB expanded metadata limit                                          |
| Workbook archive entries | Maximum 1,000 counted entries                                                            |
| General member text      | 240 characters per field                                                                 |
| AWS SBG ID               | 3–80 permitted characters                                                                |
| Source photo upload      | Up to 8 MB; JPG, PNG, or WebP                                                            |
| Photo source dimensions  | At least 100 × 100; at most 40 megapixels                                                |
| Browser-normalized photo | Longest side capped at 2,400 pixels                                                      |
| Server photo dimensions  | Each side must be 100–4,096 pixels                                                       |
| Photo zoom               | 1×–4×                                                                                    |
| Approved background      | PNG, 1200 × 1950; up to 12 MB                                                            |
| Template mapping         | At most 20 text fields and 20 accent regions                                             |
| Mapped text sizes        | Minimum at least 12; configured maximum no more than 180 canvas pixels                   |
| Team mappings            | Up to 100 entries                                                                        |
| Generated file upload    | Up to 20 MB per front/back/PDF file                                                      |
| ZIP source-file total    | 300 MB safeguard; use smaller selections above this                                      |
| Generation execution     | Browser-driven sequential processing; no persistent background queue                     |
| Record/history listing   | Current implementation loads full collections; server-side pagination is not implemented |

These are application limits, not a production capacity or security certification. Large real-world datasets and photo batches still require acceptance/performance testing.

## 16. Source Code Organization

| Location                                                        | Developed responsibility                                                  |
| --------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `app/layout.tsx`, `app/globals.css`, `app/loading.tsx`          | Root layout, provider integration, styles, and loading state              |
| `app/page.tsx` and feature page folders                         | Dashboard, Members, Generate ID, Templates, and Generated IDs routes      |
| `app/api/[...path]/route.ts`                                    | Backend API dispatch and common error handling                            |
| `components/data-provider.tsx`                                  | Session-aware shared data loading and refresh                             |
| `components/sidebar.tsx`, `components/app-layout.tsx`           | Existing responsive navigation and shell                                  |
| `components/dashboard.tsx`                                      | Real metrics and activity                                                 |
| `components/import-members.tsx`                                 | XLSX upload, validation report, and confirmation                          |
| `components/member-directory.tsx`, `components/member-form.tsx` | Directory, filters, selection, manual entry, and reusable fields          |
| `components/generate-id-workspace.tsx`                          | Review queue, edits, confirmation, Save & Next, and individual generation |
| `components/photo-editor.tsx`                                   | Upload, reposition, zoom, apply, replace, and remove photo                |
| `components/id-preview.tsx`                                     | Front/back canvas preview and render feedback                             |
| `components/generation-controls.tsx`                            | Selected/filtered/all-ready batches and progress                          |
| `components/generated-history.tsx`                              | Saved output history, previews, and downloads                             |
| `components/template-settings.tsx`                              | Approved asset setup and officer color configuration                      |
| `components/ui/`                                                | Retained reusable UI primitive catalog                                    |
| `lib/domain.ts`                                                 | Member types, validation, statuses, names, filenames, and colors          |
| `lib/import-xlsx.ts`                                            | Workbook parsing and row validation                                       |
| `lib/templates.ts`                                              | Fixed dimensions, template contracts, mapping validation                  |
| `lib/render-id.ts`                                              | Photo normalization, crop geometry, text fitting, and canvas composition  |
| `lib/export-id.ts`                                              | Generation orchestration, PDFs, downloads, and ZIPs                       |
| `lib/client.ts`                                                 | Shared client API/file URL/error helpers                                  |
| `lib/server/auth.ts`                                            | Allowlist login and signed-session authorization                          |
| `lib/server/database.ts`, `lib/server/errors.ts`                | Runtime bindings, prepared queries, revisions, and application errors     |
| `lib/server/members.ts`                                         | Persistent import, member edits, photo changes, and confirmation          |
| `lib/server/configuration.ts`                                   | Template and team-color persistence                                       |
| `lib/server/generation.ts`                                      | Output validation/storage and saved generation state                      |
| `db/schema.ts`, `drizzle/`, `drizzle.config.ts`                 | Database schema and migration sources                                     |
| `vite.config.ts`, `wrangler.local.json`, `.openai/hosting.json` | Existing runtime/build integration and logical bindings                   |
| `scripts/officer-hash.mjs`                                      | Create an allowlisted officer password-hash entry                         |
| `scripts/start-e2e.mjs`, `playwright.config.ts`                 | Isolated browser-test setup                                               |
| `tests/*.test.ts`, `tests/e2e/`                                 | Unit and browser/API verification                                         |

Old mock-data modules and obsolete sample ID/member/history components were removed as their replacements became connected to real data. Remaining shared components are not all necessarily used by every route.

## 17. Local Setup and Commands

### 17.1 Run the Development Application

From the repository directory, with Node.js 22.13 or newer installed:

```sh
npm install
npm run db:migrate
npm run dev
```

Open `http://localhost:3000` if that is the URL printed by the server. Keep the terminal running while using the application. Stop it with Ctrl+C when finished.

The normal database starts empty. Import actual organization data when ready; approved template setup is required before generating real IDs.

### 17.2 Available Scripts

| Command               | Purpose                                                                       |
| --------------------- | ----------------------------------------------------------------------------- |
| `npm run dev`         | Start local development                                                       |
| `npm run build`       | Create the production build                                                   |
| `npm start`           | Run Wrangler against the built server configuration; not a deployment command |
| `npm run db:generate` | Generate migrations after schema changes                                      |
| `npm run db:migrate`  | Apply migrations to the regular local D1 database                             |
| `npm test`            | Run unit tests                                                                |
| `npm run test:e2e`    | Run isolated browser/API tests                                                |
| `npm run typecheck`   | Run TypeScript validation                                                     |
| `npm run lint`        | Run lint validation                                                           |
| `npm run format`      | Format project source                                                         |

Close the ordinary development server before browser tests because the current Vinext setup permits one dev server per checkout. Browser tests use installed Microsoft Edge and port 3100.

## 18. Online Configuration — Not Yet Deployed

| Setting/binding    | Purpose                                                                       |
| ------------------ | ----------------------------------------------------------------------------- |
| `DB`               | D1 database binding                                                           |
| `FILES`            | R2 bucket binding                                                             |
| `SESSION_SECRET`   | Random session-signing secret of at least 32 characters                       |
| `AUTH_USERS`       | JSON map of allowed officer emails to salt/hash objects                       |
| `DEV_LOCAL_ONLY`   | Development-only bypass; must not be enabled for an online production service |
| `OFFICER_PASSWORD` | Temporary input to the local officer-hash helper, not a frontend setting      |
| `ID_TEST_STATE`    | Isolated test storage path used by the test launcher                          |

The officer-hash helper is invoked with an officer email argument and the password in its process environment. It requires a password of at least 12 characters and prints the account salt/hash entry, not the plaintext password.

Before online use, configure actual resources, migrations, officer accounts, secrets, HTTPS, login rate limiting, backups, and data retention. Keep secrets out of source control. A deployment without required authentication configuration fails closed.

No public production URL, provisioned shared D1/R2 environment, or completed production-host authentication test is claimed by this document.

## 19. Testing Completed

These are the latest recorded implementation-validation results from September 9, 2026. They were not rerun merely to create this documentation.

| Check                                  | Recorded result                                                     |
| -------------------------------------- | ------------------------------------------------------------------- |
| Unit tests                             | 11 passed                                                           |
| Browser/API tests                      | 2 passed                                                            |
| TypeScript                             | Passed                                                              |
| Lint                                   | Passed                                                              |
| Production build                       | Passed                                                              |
| Regular local database isolation check | Zero members, zero generations, zero templates at verification time |

Verified coverage includes:

- Name formatting, missing middle names, validation, dates, and status logic.
- 80-row XLSX parsing, invalid workbooks, duplicate IDs, and invalid categories/emails.
- Empty-system import flow and explicit valid-row confirmation.
- Manual photo upload and crop persistence after refresh.
- Front/back rendering and long names/positions/emails.
- Officer team color resolution, manual override logic, and fixed category colors.
- Confirm ID, Save & Next, Needs Attention/Needs Photo transitions, and stale-edit rejection.
- Individual, selected, and all-ready generation.
- Exact PNG dimensions, an exported officer-color pixel, and two-page PDF structure.
- Regeneration retaining earlier saved output bytes.
- ZIP file counts and category folders.
- An 80-member persistent API import and all-or-nothing duplicate rejection.
- Signed officer sessions, rejected invalid credentials/tampering, and fail-closed configuration.
- Five-page mobile overflow checks with no recorded browser page errors.

Limits of that evidence:

- Templates and members used for automation are isolated test fixtures.
- No final visual approval against the six real Canva designs has occurred.
- The 80-member database test is not an 80-photo/80-ID generation performance benchmark.
- There has not been exhaustive testing of every UI action, browser engine, accessibility criterion, network failure, or concurrent-officer scenario.
- Real-officer acceptance testing and online deployment verification are pending.

## 20. Remaining Work and Known Limitations

### Required to Complete Organization-Specific ID Production

1. Supply the six approved 1200 × 1950 Canva PNG backgrounds.
2. Confirm photo/text coordinates and permitted accent regions.
3. Check whether Arial and rectangular accents match the approved designs; adapt only if approval requires it.
4. Configure the templates, then visually verify all categories and both sides with real member photos and long fields.
5. Perform the complete workflow with the real membership workbook and organization officers.

### Required Before Online Release

1. Provision/configure shared database and file storage and apply migrations.
2. Configure authorized accounts and session secrets, then verify login/logout and protected file access on the actual host.
3. Add host-level login rate limiting and operational monitoring.
4. Define backups, restore procedures, retention, and deletion of member photos/exports.
5. Test realistic generation/ZIP volumes and relevant browser/device combinations.
6. Review dependency advisories and non-blocking build warnings.

The September 8 dependency audit recorded **six moderate transitive findings and no high-severity findings after runtime patches**. Two findings remain in the production-only ExcelJS/uuid dependency chain; the others relate to development tooling. These are historical audit results, not a continuously monitored security guarantee. A breaking dependency downgrade was not applied merely to silence the report.

The build also reports non-blocking upstream optimization and large-chunk warnings. Import/export libraries are loaded on demand, but further performance measurement may still be useful with actual organizational volumes.

### Not Implemented / Outside the Current v1 Scope

- Canva API integration or a full visual template editor.
- User-facing template version-history management.
- QR codes, attendance tracking, or AI photo recognition.
- Complex roles, self-service registration, password recovery, or MFA.
- Member deletion UI, retention jobs, and historical file cleanup tools.
- Background/resumable server-side generation jobs.
- Multi-ID print-sheet layouts.
- Supabase synchronization or AWS service integration.
- Advanced analytics, server-side pagination, and automated renewal workflows.

## 21. Development Milestones

The functional-development baseline was pushed to `main` in nine logical commits:

| Commit    | Development area                                                        |
| --------- | ----------------------------------------------------------------------- |
| `5295b85` | Persistent member storage and protected workflow APIs                   |
| `649f8fa` | Validated XLSX import and live data provider                            |
| `6669e84` | Fixed-size ID rendering and PNG/PDF/ZIP export                          |
| `9e44f7b` | Member review, photo cropping, and batch generation                     |
| `c5f9c9f` | Real dashboard, templates configuration, history, and mock-data removal |
| `a322795` | Validation, review transitions, and transactional import hardening      |
| `9cb7ead` | Runtime dependency patches and import/export prebundling                |
| `c0f0680` | Accessible control labels, accent contrast, and source formatting       |
| `36e5cb3` | End-to-end verification and setup documentation                         |

The earlier `PROTOTYPE_STATUS.md` describes the original UI prototype and should not be mistaken for the current functional feature status.

## 22. Supporting Documents

- `README.md`: short project introduction and quick start.
- `docs/DEVELOPMENT.md`: operation, storage, credentials, limits, and remaining release work.
- `docs/TEMPLATE_SETUP.md`: approved asset and mapping requirements.
- `docs/VALIDATION.md`: recorded automated verification and limitations.
- `package.json` and `package-lock.json`: declared dependencies and exact locked installation.
- `AWS_SBG_ID_GENERATOR_BUILD_SPEC.md`: user-supplied requirements document; supplied separately, not assumed to be checked into this repository.

## Final Assessment

**The core development pipeline is implemented and has passed the recorded automated checks. The application is no longer a mock-data frontend. However, final approved-template integration, real-member acceptance testing, and production deployment/security operations remain incomplete.**

Once the approved assets are configured and verified, the intended officer workflow is available without editing application source code: import members, review their information and photos, confirm them, generate ready IDs, export files, and retrieve earlier generations.
