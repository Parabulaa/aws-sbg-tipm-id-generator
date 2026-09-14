# AWS SBG TIP Manila ID Generator - Project Context Handoff

Last updated: 2026-09-12

## 1. Latest Project Files / Repo State

Project path:

`C:\Users\james\OneDrive\Documents\ChatGPT\aws-sbg-id-generator`

Repository:

`https://github.com/Parabulaa/aws-sbg-tipm-id-generator.git`

Current branch:

`main`

Latest pushed commits:

```text
38d5864 rebuild members management workspace
c12d39a refine workspace gradient and sidebar behavior
4f09e6f compact and unify internal workspace UI
c58d457 build internal landing and officer login UI
df8bc55 simplify template setup and remove back mappings
```

Current tracked implementation areas:

- `app/members/page.tsx` - Members page route.
- `components/member-directory.tsx` - Members management UI, filters, table, selection, delete dialog, archive/restore, pagination.
- `components/sidebar.tsx` - Collapsible dark sidebar and logout behavior.
- `components/app-layout.tsx` - Internal app shell layout.
- `components/generate-id-workspace.tsx` - Generate ID workflow and preview.
- `components/id-preview.tsx` - Front/back ID preview rendering.
- `components/photo-editor.tsx` - Photo crop/position/zoom controls.
- `components/template-settings.tsx` - Template upload/management.
- `lib/templates.ts` - Template mapping helpers.
- `lib/render-id.ts` - ID canvas rendering.
- `lib/export-id.ts` - Generated ID export logic.
- `lib/domain.ts` - App domain types and business logic.
- `app/api/[...path]/route.ts` - API routes, Supabase-backed mutations, generation, member actions.
- `template-mappings/*.json` - Front-side JSON mappings for member/officer templates.
- `supabase/migrations/*.sql` - Supabase schema and RPC migrations.

Current untracked local files that should not be pushed unless intentionally reviewed:

```text
AWS_SBG_ID_GENERATOR_COMPLETE_DOCUMENTATION.md
PROTOTYPE_STATUS.md
member-front.json
officer-template-mappings.zip
```

Project stack:

- Vinext / React 19 / TypeScript
- Supabase database, auth, storage, RLS, and RPC functions
- ExcelJS for XLSX import
- Canvas-based ID rendering/export
- Playwright E2E tests
- Oxlint / Oxfmt / TypeScript typecheck
- Vercel connected to `main`

Important scripts:

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run test:e2e
```

Latest verified before the Members rebuild was pushed:

- Typecheck passed.
- Lint passed.
- Unit tests passed.
- Production build passed.
- E2E workflow tests passed.

## 2. Current Feature / Page Being Worked On

Active focus: Members page and Generate ID / template workflow.

The Members page was rebuilt to match a compact dark management dashboard reference while preserving existing database-backed behavior.

Current Members page requirements:

- Show real database counts for:
  - Total Members
  - Officers
  - Associates
  - Archived
- Use one unified management/filter container containing:
  - Search
  - Course filter
  - Year Level filter
  - Role / Team filter
  - Status filter
- Include equal-sized action buttons:
  - Import XLSX
  - Add Member
  - Show Archived
  - Delete Selected
  - Generate Selected
  - Generate Ready in Filter
  - Generate All Ready
  - Clear Filters
- Keep all action buttons visually consistent:
  - Same height
  - Same width behavior
  - Same padding
  - Same border radius
  - Aligned grid/row layout
- Delete Selected:
  - Disabled or non-operational when no records are selected.
  - Opens a proper UI confirmation dialog.
  - Confirmation text: `Are you sure you want to delete the selected member(s)?`
  - Buttons: `Cancel` and `Delete`
  - Must not use browser `alert()` or `confirm()`.
  - Must delete from Supabase and refresh list/counts.
- Members table must keep:
  - Select checkbox
  - Photo
  - Name
  - ID Number
  - Role / Team
  - Type
  - Status
  - Validity
  - Action
  - Selected-record count
  - Pagination
  - Rows per page
  - Review/Edit action/menu

Sidebar requirements:

- Sidebar remains collapsible.
- Remove the extra collapse button directly beside/below the AWS logo.
- Preserve the intended collapse trigger.
- When collapsed, clicking the AWS logo/badge should expand or return the sidebar.
- Collapsed sidebar icon buttons remain clickable.
- Tooltips/labels should exist on hover if needed.
- Active nav state must work.
- Logout must work in both expanded and collapsed states.
- Logout must clear the existing session and redirect to Login.

Recent visual direction:

- Dark internal workspace UI.
- Dashboard/background uses the dark gradient direction from the provided login/landing reference.
- Avoid random circles, neon glare, and wasted empty space.
- Use boxed buttons.
- Keep controls compact, aligned, and operational.
- Do not redesign unrelated pages unless requested.

## 3. Finalized Generate ID Prompt

Use this prompt for continuing the Generate ID/template work:

```text
Update the Generate ID and Templates workflow for the AWS SBG TIP Manila ID Generator.

Preserve all existing functionality, Supabase integration, auth/session behavior, storage behavior, and current ID generation/export flow. Do not use mock data.

The generated ID output size must remain exactly 1200 x 1950 px.

ID number format must use AWSSBG, not AWSCC. The current expected format is:

AWSSBG-TIPM-26001

Use year 26 for the current batch. Serial numbers start at 001. Officers should be numbered first by the officer/member order, with Captain/first officer as serial 001 when applicable.

Front templates require mapped regions for:

- photo
- name
- role
- aws_sbg_id
- email

Back templates do not need JSON mapping because the back is already a completed design. The user only needs to upload the back PNG. Remove or hide unnecessary back JSON upload/mapping UI if it has no use case.

Provide separate front template support/previews for all officer offices:

- Executive - Emerald
- Operations - Gold/Khaki
- Relations - Navy Blue
- Buildhers - Pink
- Marketing - Pink & Green
- Finance - Purple
- Creatives - Red
- Technology - Blue/Pink

Lorso is part of Executive.

Each officer office may need its own JSON mapping because the photo frames are not perfectly aligned across designs. Use separate front JSON mapping files per office instead of forcing one shared officer mapping.

Members must have separate front and back template preview support.

In the Templates page, show previews for:

- all 8 officer front designs
- member front
- member back

The photo must fit exactly inside the visual frame on each template. The photo should maximize the frame space, be clipped/rounded correctly, and not cover the decorative border. Use the approved photo region from the mapping JSON as the clipping area. The preview and final exported PNG must match.

When reviewing or editing members/officers, the user must be able to access the Review/Edit page reliably. The previous broken route/page-load issue must remain fixed.

When previewing generated IDs, the user must be able to see the front and back preview before exporting/generating.

Remove confusing or unnecessary UI:

- Remove Officer accent override if team/office template colors are fixed.
- Remove shared officer/associate template cards if the workflow now uses office-specific templates and member-specific front/back templates.
- Remove unnecessary back JSON upload because back designs do not need mapped dynamic fields.

Keep the implementation clean, responsive, and consistent with the current dark internal app UI.
```

## 4. Important Constraints

Database and backend:

- Supabase is the source of truth.
- Do not use mock data.
- Do not remove RLS, storage cleanup, auth checks, or admin restrictions.
- Existing add/import/archive/delete/generate behavior must be preserved.
- Member counts must update after add, import, archive, restore, delete, and generation-related status changes.
- Delete behavior depends on the Supabase RPC migration:

```text
supabase/migrations/20260912000100_delete_members.sql
```

That migration creates:

```sql
public.delete_members(member_ids uuid[], actor uuid)
```

The migration must be applied in Supabase before the deployed Delete Selected feature can work.

ID generation:

- Final PNG export size stays `1200 x 1950`.
- Existing preview label also uses `1200 x 1950 px`.
- Preview and exported output must use the same mapping and renderer.
- No visual mismatch between preview and generated/exported ID.
- Photo crop must be rounded/clipped to the mapped frame region.
- Photo should cover/maximize the frame without stretching.

ID number:

- Correct prefix is `AWSSBG`, not `AWSCC`.
- Current expected format: `AWSSBG-TIPM-26001`.
- Older `AWS-SBG-TIPM-2026-0001` style should not be reintroduced if the new format is the accepted one.

Templates:

- Front designs need JSON because dynamic fields must be mapped.
- Back designs do not need JSON unless dynamic text/QR/signature fields are added later.
- Officer templates are office-specific.
- Member front/back templates are separate from officer templates.
- Avoid shared generic officer/associate template UI if it is no longer part of the workflow.

UI/UX:

- Keep dark internal app palette.
- Avoid oversized explanatory text.
- Avoid large wasted page spacing.
- Use compact operational layouts.
- Buttons should be boxed and aligned.
- No random amber buttons in the Members management area.
- Danger/destructive actions can use red.
- Sidebar should be collapsible and usable in both states.
- Do not redesign unrelated pages unless explicitly requested.

Deployment:

- Push changes to `main` only when requested.
- Vercel deploys from `main`.
- Applying Supabase migrations is a separate database action and is not completed by pushing code.

## Recommended Next Step

Apply the Supabase migration `20260912000100_delete_members.sql` in the Supabase SQL Editor if it has not been applied yet. After that, test the deployed Members page by selecting one test member, opening Delete Selected, canceling once, then deleting only when the selected record is safe to remove.
