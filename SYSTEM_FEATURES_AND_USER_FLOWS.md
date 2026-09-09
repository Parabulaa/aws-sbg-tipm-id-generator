# AWS SBG TIP Manila ID Generator

This document describes the currently implemented system, its features, and how Administrators and Officers use it.

## Purpose

The application manages AWS SBG TIP Manila member records and produces organization IDs through this workflow:

```text
Sign in → Import members → Review member → Upload photo → Confirm information → Generate front ID → Download/export
```

## Technology stack

- React 19
- TypeScript
- Vinext/Vite
- Tailwind CSS
- shadcn/ui-compatible components
- Supabase Auth
- Supabase PostgreSQL
- Supabase private Storage
- Supabase Row Level Security (RLS)
- ExcelJS for XLSX import
- Canvas rendering for IDs and photos
- pdf-lib for PDF creation
- JSZip for ZIP exports
- Vitest-style Node tests through `tsx`
- Playwright for end-to-end browser tests

## Implemented features

### Authentication and access

- Public Home page
- Officer Login page
- Supabase email/password authentication
- Active Officer and Admin roles
- Protected application routes
- Admin-only officer access management
- Admin-only template and color configuration
- Database-enforced RLS permissions

### Member management

- XLSX membership import
- Five supported membership fields:
  - Full name
  - TIP email
  - Student ID number
  - Program
  - Year level
- Duplicate detection by email and student ID
- Automatic AWS SBG ID allocation
- Member, Associate, and Officer classification
- Membership Type dropdown
- Controlled Officer Position dropdown
- Automatic Team/Office derivation
- Member editing and validation
- Archive Member workflow
- Admin restore workflow

### Photo management

- Manual photo upload during review
- JPG, PNG, and WebP input support
- Photo normalization to PNG
- Crop position controls
- Zoom control
- Horizontal and vertical repositioning
- Save photo crop with the member record
- Private member-photo storage

### ID templates and rendering

- Approved PNG template upload
- Required template size: `1200 × 1950 px`
- JSON field mapping for text and photo regions
- Separate Member, Associate, and Officer templates
- Front and back template slots
- Officer team-based accent colors
- Manual officer color override
- Front and back ID preview rendering

### Status workflow

- `Draft` — member information is incomplete or being edited
- `Needs Photo` — required member information exists but no photo is saved
- `Needs Attention` — validation errors or missing required information remain
- `Ready` — information and photo were reviewed and confirmed
- `Generated` — an ID file has been generated and saved in history

### ID generation and exports

- Front-only ID generation is currently the primary generation action
- Front PNG output at exactly `1200 × 1950 px`
- Front-only generation does not require a back template or PDF
- Generated front files are saved in generation history
- Front preview and download
- Existing front/back/PDF export support remains available for complete two-sided records
- Selected and bulk ZIP export support where corresponding files exist
- Private generated-ID storage

### History and activity

- Generated ID history
- Immutable member snapshot for each generated record
- Generation date and template version tracking
- Activity history for member and ID actions
- Admin/officer visibility controlled by RLS

## Officer navigation

```text
Home
  ↓
Officer Login
  ↓
Dashboard
  ↓
Members
  ↓
Review member
  ↓
Generate ID
  ↓
Generated IDs
```

### Officer workflow

1. Open the Home page and select **Officer Login**.
2. Sign in with the Supabase account provided by an Administrator.
3. Review dashboard metrics and alerts.
4. Open **Members**.
5. Import the membership XLSX file.
6. Select a member and check the imported information.
7. Correct any validation errors.
8. Upload the member photo.
9. Crop, zoom, and reposition the photo.
10. Click **Apply uploaded photo**.
11. Click **Save information** if member fields were edited.
12. Click **Confirm ID** after verifying the member information and photo.
13. Open **Generate ID**.
14. Select the confirmed member.
15. Check the front preview.
16. Click **Generate Front ID**.
17. Download the generated front PNG.
18. Open **Generated IDs** to review saved generations and export files.

### Officer permissions

Officers can:

- View their protected dashboard
- Import and edit member records
- Upload and adjust photos
- Confirm members
- Generate front IDs
- Download and export available generated files
- View member, generation, and activity records
- Archive members according to the workflow permissions

Officers cannot:

- Change another user’s role
- Activate or deactivate other users
- Upload or replace approved templates
- Change system color settings
- Restore archived members

## Admin navigation

```text
Home
  ↓
Officer Login
  ↓
Dashboard
  ├── Members
  ├── Generate ID
  ├── Generated IDs
  ├── Templates
  └── Officer Access
```

### Admin workflow

An Administrator follows the same member-review and generation flow as an Officer, plus the following setup tasks:

1. Open **Templates**.
2. Upload the approved PNG template.
3. Upload the matching JSON mapping.
4. Confirm the template category and side.
5. Mark the template approved.
6. Repeat for the required membership categories and sides.
7. Configure officer team colors.
8. Open **Officer Access**.
9. Review active users and roles.
10. Activate, deactivate, or promote users when required.
11. Restore archived members from the Members area when necessary.

### Admin permissions

Admins can:

- Perform all Officer actions
- Manage officer access
- Assign Admin or Officer roles
- Activate and deactivate officer profiles
- Upload and approve templates
- Replace template images and mappings
- Configure team colors
- Restore archived members
- View all protected operational records

## Template requirements

Each template uses:

- One PNG image at exactly `1200 × 1950 px`
- One JSON mapping file

Front mappings must include regions for:

- Photo
- Name
- Role
- AWS SBG ID
- Email

The mapping coordinates must match the actual PNG design. The application does not invent or provide official organization artwork.

## Data and security

- Application records are stored in Supabase PostgreSQL.
- Photos, templates, and generated files are stored in private Supabase Storage buckets.
- Authentication uses Supabase Auth.
- RLS policies enforce Admin and Officer permissions at database level.
- Publishable Supabase configuration belongs in local `.env.local` only.
- Secret/service keys must never be committed to GitHub.

## Local development

From the repository directory:

```powershell
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), then sign in with a Supabase Auth user that has an active `officer_profiles` record.

## Current generation focus

The current main generation action is **front-only** so an officer can create and validate the front ID without waiting for a back template. Complete two-sided generation and PDF/ZIP workflows remain supported when both approved sides and their files are available.
