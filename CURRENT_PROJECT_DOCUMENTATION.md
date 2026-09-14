# AWS SBG TIP Manila ID Generator — Complete Project Documentation

Last updated: September 14, 2026
Repository: `https://github.com/Parabulaa/aws-sbg-tipm-id-generator`
Production deployment: `https://aws-sbg-id-generator.vercel.app`
Primary branch: `main`

## 1. Project overview

The AWS SBG TIP Manila ID Generator is an internal web application for managing organization members and producing membership ID cards. It replaces a manual, file-based workflow with one protected workspace for importing member data, reviewing records, preparing photos, generating IDs, managing officer access, and auditing system activity.

The intended end-to-end workflow is:

```text
Public landing page
  → Officer login
  → Protected dashboard
  → Import or add members
  → Review information and photo
  → Confirm the record
  → Preview and generate the ID
  → Download or retrieve generated files
  → Review activity/history
```

The application is designed for two authenticated account roles:

- **Officer** — performs member-management and ID-production work.
- **Admin** — has Officer capabilities plus account, role, template, color, and audit administration.

## 2. Current project status

The project is a functional Supabase-backed application rather than a static prototype. Authentication, protected routes, member records, photo storage, template configuration, ID generation, generation history, archive/restore, admin access management, password-change enforcement, and activity feeds are implemented.

Recent completed work includes:

- Public Home and Login pages using the shared dark cyan/blue visual language.
- Shared public microchip brand mark and guarded same-route navigation.
- Animated public background and Home/Login page transitions.
- Responsive internal dashboard shell with collapsible sidebar.
- Admin Access Management and Activity Logs pages.
- Server-side officer account creation and editing through Supabase Admin Auth.
- Role promotion/demotion, activation/deactivation, temporary password reset, and forced password change.
- Reserved administrator normalization for `mjramba@tip.edu.ph`.
- Member archive retrieval and restore access for Officers as well as Admins.
- Activity Logs aggregation from both administrative logs and normal application activities.
- Auto-dismissing success and error notifications for admin operations.
- Environment-variable aliases for both `VITE_*` and `NEXT_PUBLIC_*` public Supabase settings.

External configuration is still required for a working deployment:

- A Supabase project with all checked-in migrations applied.
- Correct public Supabase URL and publishable-key environment variables.
- A server-only Supabase secret/service-role key for Admin Auth operations.
- Approved organization template PNGs and correct JSON field mappings.
- Real-account and real-template acceptance testing in the intended Supabase project.

## 3. Users and use cases

### 3.1 Public visitor

A public visitor can:

- View the Home/Landing page.
- Interact with the sample front/back ID card.
- Open the organization email link.
- Open the official Facebook page.
- Navigate to Officer Login.

The public brand is a no-op when it already points to the current route, preventing repeated page-slide animations and duplicate browser-history entries.

### 3.2 Officer

An active Officer can:

- Sign in with an authorized Supabase email/password account.
- View dashboard counts and recent operational activity.
- Import members from XLSX.
- Add a member manually.
- Search and filter members.
- Review and edit member information.
- Assign membership type and a controlled Officer position.
- Upload, remove, crop, zoom, and reposition a member photo.
- Confirm a valid member record for production.
- Preview the configured ID design.
- Generate ID files.
- View and download generated records.
- Archive a member.
- View archived members and restore them.
- Change their own temporary password when required.

An Officer cannot use Admin-only APIs to manage accounts, promote users, upload/replace templates, or update global color configuration.

### 3.3 Administrator

An Admin can perform every Officer workflow and can additionally:

- View all officer profiles in Access Management.
- Create an Officer Auth account with a temporary password.
- Require a newly created Officer to change the password on first login.
- Edit display name and email.
- Promote an Officer to Admin or demote an Admin to Officer.
- Activate or deactivate an account.
- Set a new temporary password for an existing account.
- Require a password change on the account's next login.
- View combined administrative and operational Activity Logs.
- Search and filter activity entries.
- Upload and replace approved templates and JSON mappings.
- Manage the global/team color configuration.
- Permanently delete selected members through the protected Admin operation.

The server prevents an update that would leave the system without at least one active administrator.

## 4. User interaction and page map

### `/` — Home/Landing

- Public route; no authentication required.
- Presents organization branding, product purpose, Officer Login call-to-action, and interactive sample ID.
- The sample card flips between front and back.
- Footer contains `awslc.mnl@tip.edu.ph` and `https://www.facebook.com/awssbgtip` links.
- Home to Login uses the public forward push transition.

### `/login` — Officer Login

- Accepts email and password through Supabase Auth.
- Shows a clear error for invalid credentials or unavailable accounts.
- An existing session is redirected to `/dashboard`.
- Brand and Back to Home navigation use the reverse public transition.
- Same-route navigation is guarded and does not replay the transition.

### `/change-password` — Required password change

- Used when `officer_profiles.must_change_password` is true.
- Requires an eight-character minimum new password and matching confirmation.
- Updates the Supabase Auth password server-side.
- Clears the force-change flag and redirects to Dashboard after success.
- Other protected application operations are blocked until this step is completed.

### `/dashboard` — Operations overview

- Displays real counts derived from current member, template, and generation data.
- Shows ID-production status and recent activity.
- Provides shortcuts into import/review, generation, and member creation.
- Uses the authenticated profile name and role in the sidebar.

### `/members` — Member directory

- Displays Total Members, Officers, Associates, and Archived metrics.
- Supports search, course, year, role/team, and status filters.
- Provides XLSX import and manual Add Member actions.
- Supports row selection, pagination, generation shortcuts, archive, restore, and Admin deletion.
- Opens archived records in a searchable dialog.
- Links each active record to the Review/Edit ID workspace.

### `/generate-id` — Review and ID production workspace

- Selects a member directly or through `?member=<member-id>`.
- Contains Information, Photo Adjustment, and Appearance tabs.
- Saves member edits using optimistic-concurrency revisions.
- Uploads and edits the member photo.
- Confirms valid records.
- Renders front/back previews using the selected approved template.
- Generates and saves output files and metadata.
- Links to Generated IDs for retrieval.

The Appearance control calculates and stores an effective accent color. A visible output change only occurs where the selected template JSON defines dynamic `accents` or another mapped element uses that color. A fully static PNG with no accent mapping will look unchanged; the renderer does not recolor arbitrary pixels in a finished image.

### `/templates` — Template configuration

- Loads configured templates and color settings for authenticated users.
- Admin-protected save APIs accept approved PNG templates and JSON mappings.
- Supports Member, Associate, and Officer designs.
- Officer template selection can use team/office-specific designs.
- All generated canvases remain exactly `1200 × 1950` pixels.

### `/generated-ids` — Generation history

- Lists saved ID generations and immutable member snapshots.
- Supports search, filtering, selection, detail view, and pagination.
- Retrieves protected generated assets through authenticated file requests.
- Downloads available PNG, PDF, and ZIP output depending on what was generated.
- Can reopen a member for review/regeneration.

### `/admin/access-management` — Account administration

- Admin-only route and API behavior.
- Shows Total Accounts, Admins, and Officers with matching metric-card sizing.
- Supports search and role filtering.
- Add Officer dialog creates the Auth user and application profile.
- Selected User panel edits identity, role, status, temporary password, and password-change requirement.
- Operations show auto-dismissing status notifications.

### `/admin/activity-logs` — Audit view

- Admin-only route and API behavior.
- Combines rows from `activity_logs` and the normal `activities` feed.
- Shows totals for all logs, today's activity, Admin actions, and Officer actions.
- Supports text, action, and time filtering.
- Includes recent security/admin events.
- Refresh loads the current database state.

## 5. Member and ID workflow

### 5.1 Supported member information

Core imported/manual fields are:

- Full name
- TIP email
- Student ID number
- Program/course
- Year level

Additional production fields include:

- Membership type: Member, Officer, or Associate
- Officer position
- Derived team/office
- AWS SBG membership ID
- Photo and crop data
- Optional Officer color override
- Date issued and validity date
- Workflow status and revision
- Created/updated/archive metadata

### 5.2 Officer positions and team derivation

Officer positions are controlled values, including Executive, Secretarial, BuildHers+, Finance, Operations, Marketing, Relations, Creatives, and Technology leadership positions. The application and database derive the corresponding team automatically. Technology positions, AI/ML Lead, and Software Engineering Lead map to `Technology / CTO Office`; LORSO maps to `Executive`.

### 5.3 Membership ID allocation

New IDs are allocated by database functions under a locked yearly counter to avoid duplicate numbers during concurrent imports. The current formatter combines:

```text
configured prefix + two-digit year + four-digit serial
```

Example with prefix `AWSSBG-TIPM`, year 2026, and serial 22:

```text
AWSSBG-TIPM-260022
```

Uniqueness is enforced in PostgreSQL. Later migrations support reusable membership slots and active-membership allocation rules. Existing assigned IDs are preserved when prefix logic changes.

### 5.4 Status lifecycle

- **Draft** — record exists and is still being prepared.
- **Needs Photo** — required information exists but no saved photo is available.
- **Needs Attention** — validation errors or incomplete required data remain.
- **Ready** — information and photo were reviewed and confirmed.
- **Generated** — an ID generation was recorded.

Archived state is represented separately by `archived_at`, so an archived record can retain its prior production status.

### 5.5 Import behavior

- XLSX files are parsed with ExcelJS.
- Header aliases and five-field input are supported.
- Values are normalized before submission.
- Email and student-ID duplicates are checked.
- IDs are allocated in import order, so officer-first import ordering can reserve the earliest serials for Officers.

### 5.6 Photo behavior

- Supported source formats include PNG, JPEG, and WebP.
- Photos are normalized and stored privately.
- Crop data uses horizontal position, vertical position, and zoom.
- Preview and final rendering share the mapped photo region.
- Template mappings may define rounded corners or a clipping polygon so the photo stays inside the designed frame.

## 6. Template and rendering system

### Template assets

- Approved template images must be PNG.
- Required dimensions are `1200 × 1950` pixels.
- Files are stored in the private `id-templates` bucket.
- Layout JSON is validated and stored with template records.
- The application does not generate or invent official organization artwork.

### Mapping JSON

A template layout can contain:

- `photo` — image placement rectangle, optional radius, and optional clip polygon.
- `fields` — dynamic text boxes with position, size, alignment, weight, family, and color.
- `accents` — optional shapes that are recolored with the computed accent color.

Supported mapped fields include:

```text
full_name, name, tip_email, email, student_id_number, program,
year_level, aws_sbg_id, membership_type, role, officer_position,
team, date_issued, valid_until
```

Legacy aliases such as `name`, `email`, and `role` remain accepted.

### Template selection

- Member and Associate records select their category template.
- Officer records first attempt to select the matching team/office design.
- Approved templates are preferred for rendering.
- Front templates normally contain photo and text mappings.
- A finished back design may be used as a static image with no dynamic fields.

### Rendering and export

- Browser Canvas produces deterministic `1200 × 1950` renders.
- Text fitting reduces font size down to a configured minimum for long values.
- The photo is cover-fitted using saved crop/zoom values.
- `pdf-lib` creates PDF output where both sides are available.
- JSZip creates selected/bulk downloadable archives.
- Generated assets are saved to private Supabase Storage and indexed in `generated_ids`.

## 7. Authentication, authorization, and security

### Authentication

- Supabase email/password Auth provides sessions.
- Browser requests send the current access token to the application API.
- Protected routes load the server-verified Officer profile.
- Inactive, missing, or unauthorized profiles are rejected.

### Role enforcement

Access is enforced in multiple layers:

1. UI navigation hides Admin areas for Officers.
2. The catch-all API calls `requireOfficer` for every protected endpoint.
3. Admin endpoints call `assertOfficerRole(..., 'admin')`.
4. PostgreSQL RLS policies enforce table and Storage permissions.

The email `mjramba@tip.edu.ph` is normalized as the reserved active administrator in current server logic and migrations.

### Request and file safeguards

- Same-origin mutation protection is applied by the API handler.
- Requests larger than 65 MiB are rejected.
- Private file downloads only allow the three expected buckets.
- File paths reject traversal and unsupported characters.
- Private file responses use `Cache-Control: private, no-store`.
- Generated, photo, and template files are not public buckets.
- Member updates use revision values to detect stale edits.

### Secret handling

Only publishable settings may be exposed to browser code. A Supabase secret/service-role key must be stored only in server/deployment environment variables and must never be committed, pasted into source files, or prefixed with `VITE_` or `NEXT_PUBLIC_`.

If a service-role JWT or secret key is exposed, revoke/rotate it in Supabase, replace the deployment value, and redeploy. Creating an additional secret does not automatically invalidate a previously exposed legacy key.

## 8. Data architecture

### Main PostgreSQL tables

- `officer_profiles` — application profile, role, active state, and password-change metadata for Auth users.
- `members` — member identity, classification, photo, status, ID, dates, revision, and archive metadata.
- `templates` — template category/side/team, image path, mapping, approval, and version metadata.
- `generated_ids` — immutable generation record, member snapshot, output paths, accent, version, and actor.
- `activities` — normal member and generation workflow events.
- `activity_logs` — administrative/security audit entries.
- `app_settings` — ID prefix, validity, and color configuration.
- `id_counters` — concurrency-safe yearly sequence allocation.

### Private Storage buckets

- `member-photos`
- `id-templates`
- `generated-ids`

### Database responsibilities

Version-controlled migrations provide:

- Schema creation and constraints.
- Updated-at triggers.
- Automatic pending Officer profile creation after Auth signup.
- RLS and Storage policies.
- Concurrency-safe member creation and ID assignment.
- Officer position/team derivation.
- Generation recording.
- Archive, restore, and deletion rules.
- Role hardening and reserved Admin restoration.
- Activity logging and password-change columns.

Migrations should be applied in filename order with `supabase db push`; application tables should not be recreated manually in the dashboard.

## 9. Application architecture

### Frontend

- `app/` defines public, protected, and Admin routes.
- `components/` contains feature screens and reusable UI.
- `components/data-provider.tsx` loads the session and application datasets for protected pages.
- Pages use real API data; the production UI does not depend on mock member records.
- Global styling is primarily in `app/globals.css`, with utility classes used in internal components.

### API and server layer

`app/api/[...path]/route.ts` is the authenticated catch-all API. It delegates work to focused server modules:

- `lib/server/auth.ts` — request-origin protection.
- `lib/server/supabase.ts` — user token verification, profile normalization, and role checks.
- `lib/server/database.ts` — shared reads and bindings.
- `lib/server/members.ts` — import, update, photo, confirm, archive, restore, and delete operations.
- `lib/server/configuration.ts` — templates and colors.
- `lib/server/generation.ts` — generation recording and history.
- `lib/server/admin.ts` — Admin Auth/profile operations and activity logs.
- `lib/server/errors.ts` — safe API error responses.

### Client domain and production utilities

- `lib/domain.ts` — types, normalization, validation, statuses, ID formatting, teams, accent colors, and filenames.
- `lib/templates.ts` — mapping types, validation, and template selection.
- `lib/render-id.ts` — Canvas renderer.
- `lib/export-id.ts` — generation, download, PDF, and ZIP helpers.
- `lib/import-xlsx.ts` — workbook parsing and validation.
- `lib/client.ts` — authenticated API client and error handling.
- `lib/supabase/client.ts` — browser Supabase client.

## 10. API summary

All endpoints below are under `/api/` and require an authenticated active Officer unless noted as Admin-only.

| Endpoint | Method | Purpose | Access |
|---|---:|---|---|
| `session` | GET | Return verified profile/session state | Officer/Admin |
| `account/password` | PUT | Change own password and clear required-change state | Officer/Admin |
| `members` | GET | List active or archived members | Officer/Admin |
| `members` | POST | Manually create member records | Officer/Admin |
| `members/import` | POST | Import normalized member rows | Officer/Admin |
| `members` | DELETE | Permanently delete selected records | Admin |
| `members/:id` | PUT | Update member data | Officer/Admin |
| `members/:id/photo` | POST/DELETE | Save or remove photo | Officer/Admin |
| `members/:id/confirm` | POST | Confirm a production-ready member | Officer/Admin |
| `members/:id/archive` | POST | Archive a member | Officer/Admin |
| `members/:id/restore` | POST | Restore an archived member | Officer/Admin |
| `colors` | GET | Load color configuration | Officer/Admin |
| `colors` | PUT | Save color configuration | Admin |
| `templates` | GET | Load template configuration | Officer/Admin |
| `templates` | POST | Upload/save template and mapping | Admin |
| `generations` | GET/POST | List or create generated IDs | Officer/Admin |
| `activity` | GET | Load shared dashboard activity | Officer/Admin |
| `officers` | GET/POST | List or create accounts | Admin |
| `officers/:id` | PUT | Update role/account/password settings | Admin |
| `activity-logs` | GET | Load combined audit log | Admin |
| `files/:bucket/:path` | GET | Authenticated private-file download | Officer/Admin |

## 11. Technology stack

### Core application

- React 19
- TypeScript 5.9
- Vinext 1 beta (Next-compatible routing/runtime on Vite)
- Vite 8
- React Server Components runtime
- Node.js 22.13 or newer locally

### UI

- Tailwind CSS 4
- shadcn-compatible component library
- Base UI primitives
- Lucide React icons
- Recharts where charting is required
- Custom responsive CSS and Canvas rendering

### Backend and data

- Supabase Auth
- Supabase PostgreSQL
- Supabase Row Level Security
- Supabase private Storage
- Supabase JavaScript client and SSR helpers

### Import/export

- ExcelJS for XLSX parsing
- Canvas for PNG rendering
- pdf-lib for PDF creation
- JSZip for ZIP archives

### Quality and deployment

- TypeScript compiler for type checking
- Oxlint for linting
- Oxfmt for formatting
- Node test runner through `tsx`
- Playwright for browser/E2E tests
- Vercel deployment from `main`
- Cloudflare/Vinext runtime support remains configured in the toolchain

## 12. Environment configuration

Create `.env.local` locally and configure equivalent values in Vercel. Do not commit the file.

```dotenv
# Browser-safe values; either naming family is accepted by current code.
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY

# Optional public aliases supported by the application.
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY

# Server-side values.
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVER_SECRET_KEY
```

`SUPABASE_SECRET_KEY` and `SUPABASE_SERVICE_KEY` are also accepted server-side aliases, but using one consistent deployment name is recommended. The server secret is required for creating Auth users, changing another user's Auth email, and setting temporary passwords.

## 13. Local setup and operation

Requirements:

- Node.js 22.13+
- npm
- Supabase project
- Supabase CLI for migration management
- Docker/Podman only if running the local Supabase stack

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

Apply migrations to the selected Supabase project:

```powershell
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

Do not run a destructive linked reset against a project containing real data.

## 14. Validation commands

```powershell
npm run typecheck
npm run lint
npm test
npm run build
npm run test:e2e
```

Current automated coverage includes domain normalization and validation, ID formatting, import behavior, photo crop bounds, template mappings, color helpers, authentication helpers, migration/RLS contracts, and an isolated browser workflow from Home through generation and logout.

Playwright fixtures are isolated and do not seed or mutate the linked production Supabase project. Real Supabase Auth, RLS, Storage, templates, and deployment secrets still require manual acceptance testing.

## 15. Known limitations and remaining validation

- Approved template artwork and mappings determine visual accuracy; incorrect coordinates cannot be corrected automatically by the renderer.
- Appearance color changes are visible only in JSON-mapped accent regions. Static PNG artwork is not automatically recolored.
- Admin account creation and remote password reset require a valid server-only Supabase secret/service-role key in the deployed environment.
- The Activity Logs page depends on the latest activity-log migrations and policies being present in the target Supabase project.
- Database migrations have static repository coverage, but a full local Supabase database test requires Docker or Podman.
- Browser Back/Forward, direct `/login`, forced-password flow, account creation, role changes, archive/restore, generation, and private downloads should be rechecked after every production migration or environment-key change.
- Real organization records, photos, long names, all Officer offices, and every approved template should receive final visual acceptance testing before bulk production.

## 16. Important implementation rules for future work

- Preserve the exact `1200 × 1950` output dimensions.
- Keep ID assignment database-controlled and concurrency-safe.
- Never expose Supabase secret/service-role keys to browser code.
- Apply schema and policy changes through new migrations, not manual undocumented edits.
- Preserve RLS even when server APIs perform additional authorization.
- Do not replace approved organization artwork with invented templates.
- Keep preview and final output on the same renderer and mapping data.
- Record material Admin, member, and generation actions in the appropriate activity feed.
- Keep Officer and Admin capabilities distinct at both UI and API/database levels.
- Preserve archive as recoverable and permanent deletion as Admin-only.
- Keep success/error feedback as non-blocking, auto-dismissing application notifications.
- Run typecheck, lint, tests, and build before release.

## 17. Source-of-truth file map

```text
app/
  page.tsx                         Public Home/Landing
  login/page.tsx                   Officer Login
  change-password/page.tsx         Forced password update
  dashboard/page.tsx               Protected overview
  members/page.tsx                 Member directory
  generate-id/page.tsx             Review/generation workspace
  templates/page.tsx               Template configuration
  generated-ids/page.tsx           Generation history
  admin/access-management/page.tsx Admin account management
  admin/activity-logs/page.tsx      Audit log
  api/[...path]/route.ts            Authenticated API dispatcher

components/
  data-provider.tsx                Protected session/data loader
  dashboard.tsx                    Metrics and recent activity
  member-directory.tsx             Directory/filter/archive/restore UI
  generate-id-workspace.tsx        Review and production workflow
  photo-editor.tsx                 Photo upload and crop controls
  id-preview.tsx                   Live front/back preview
  generated-history.tsx            Saved-generation UI and downloads
  template-settings.tsx            Template/color administration
  admin-access-management.tsx      Officer account administration
  admin-activity-logs.tsx          Combined audit UI
  admin-notice.tsx                 Auto-dismissing Admin notifications
  sidebar.tsx                      Responsive protected navigation

lib/
  domain.ts                        Business types and rules
  templates.ts                     Mapping and template selection
  render-id.ts                     Canvas renderer
  export-id.ts                     PNG/PDF/ZIP operations
  import-xlsx.ts                   Spreadsheet ingestion
  client.ts                        Authenticated browser API
  supabase/client.ts               Browser Supabase configuration
  server/*.ts                      Auth, database, member, generation,
                                   configuration, and Admin services

supabase/migrations/               Versioned schema, RPC, RLS, and policies
template-mappings/                 Checked-in mapping examples/assets
tests/                             Unit and schema-contract tests
e2e/                               Browser workflow coverage
docs/                              Focused setup and validation guides
```

## 18. Handoff summary

The project currently provides the complete operational skeleton for AWS SBG TIP Manila membership ID production: secure Officer access, member ingestion and review, controlled classification, private photo handling, approved-template rendering, generation history, archive recovery, Admin account administration, password governance, and activity visibility.

The most important deployment dependencies are the current Supabase migrations, correct environment variables, a non-exposed server secret, and accurate approved template mappings. Once those are present, the remaining work is primarily real-data acceptance, template visual calibration, and ongoing production verification rather than building the core workflow from scratch.
