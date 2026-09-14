# AWS SBG TIP Manila ID Generator — Prototype Status

## Purpose

This document records what is currently implemented in the first frontend prototype, what still needs to be reviewed or improved, and which capabilities are intentionally deferred to a later development phase.

The current application is a UI-only prototype built with mock data. It is intended for reviewing the platform structure, visual direction, navigation, workflows, and placeholder ID layouts before backend development begins.

## Currently Built

### Application foundation

- React and TypeScript application
- Tailwind CSS styling
- Vinext/Vite development and production setup
- Shared light, neutral visual theme with amber as the main application accent
- Reusable page headers, cards, metric cards, status badges, loading states, and empty-state foundations
- Responsive application shell
- Fixed desktop sidebar
- Mobile and tablet navigation drawer
- Active navigation highlighting

### Application pages

The following routes are implemented:

- Dashboard
- Generate ID
- Members
- Templates
- Generated IDs

### Dashboard

- Total Members metric
- Officers metric
- Associates metric
- IDs Generated metric
- IDs Pending metric
- Expired IDs metric
- Recent ID Activity list
- Membership distribution progress bars
- Mock values derived from the current member records

### Generate ID workspace

- Searchable member selector
- Search by member name, email address, or ID number
- Immediate selected-member updates
- Previous and Next member controls
- Personal information panel containing:
  - Member photo placeholder
  - Full name
  - Organization role
  - Member ID
  - Email address
  - Membership type
  - Date issued
  - Valid-until date
- Front and Back ID preview tabs
- ID preview container using the required 1200 × 1950 aspect ratio
- Category-based ID colors:
  - Member: amber/orange
  - Officer: green
  - Associate Member: purple
- Member front-ID placeholder layout
- Back-ID event attendance layout
- Exactly seven attendance sticker slots
- Placeholder terms and conditions
- Disabled Generate ID, PNG, and PDF controls
- Preview-mode notice explaining that exports are not implemented

### Members page

- Searchable mock member directory
- Membership filters:
  - All
  - Members
  - Officers
  - Associates
- Member table containing:
  - Photo placeholder
  - Name
  - ID number
  - Organization role
  - Membership type
  - ID status
  - Validity
  - Actions
- View action placeholder
- Generate ID navigation action

### Templates page

- Six template cards:
  - Member Front
  - Member Back
  - Officer Front
  - Officer Back
  - Associate Front
  - Associate Back
- Template dimensions displayed as 1200 × 1950 px
- Active status labels
- Preview action placeholders
- Replace Template action placeholders
- Notice explaining that final Canva designs will be used as fixed templates

### Generated IDs page

- Filterable generated-ID records
- Category filters:
  - All
  - Member
  - Officer
  - Associate
- Record table containing:
  - Photo placeholder
  - Member name
  - Role
  - ID number
  - Generated date
  - Valid-until date
  - Status
  - Actions
- Preview action placeholder
- Disabled Download action

### Mock data

- Twelve realistic sample member records
- Member, officer, and associate categories
- Generated, pending, and expired ID statuses
- Example records for the requested member, officer, and associate personas
- No live database or external service connections

## Items That Need to Be Addressed

### Highest priority — design approval

- [ ] Replace the placeholder front and back ID designs with the approved Canva layouts.
- [ ] Add the official AWS SBG TIP Manila logos and permitted organization branding assets.
- [ ] Test the layouts using realistic member photos instead of initials.
- [ ] Confirm typography, spacing, colors, alignment, photo crop, and safe areas on all six templates.
- [ ] Confirm that longer names, roles, ID numbers, and email addresses fit without clipping.
- [ ] Review the ID designs at their intended 1200 × 1950 output size.

### Generate ID workflow

- [ ] Make the Generate ID action on the Members page preselect the clicked member. It currently opens the Generate ID page but returns to the default member.
- [ ] Decide whether Edit Information should open a prototype dialog or remain disabled.
- [ ] Decide whether Previous and Next should follow the complete member list or only filtered/search results.
- [ ] Improve the readability of small text inside the scaled ID preview.
- [ ] Improve color contrast on the green and purple back-card footer accents.
- [ ] Confirm whether changing members should return the preview to the Front tab.
- [ ] Confirm the final behavior and placement of Generate ID, Download PNG, and Download PDF.

### Members page

- [ ] Decide what information the View action should display.
- [ ] Consider a mobile card layout instead of requiring horizontal table scrolling.
- [ ] Confirm the desired filter and search behavior when no records match.
- [ ] Decide whether expired members, expired IDs, and inactive members need separate filters.

### Templates page

- [ ] Decide whether Preview should open a modal, side panel, or full-size preview page.
- [ ] Clearly disable Replace Template until upload support is implemented, or make it open a prototype explanation dialog.
- [ ] Define allowed template file types, dimensions, and validation rules for the later upload workflow.
- [ ] Decide whether template versions and replacement history will be required.

### Generated IDs page

- [ ] Decide what the Preview action should show.
- [ ] Confirm whether expired IDs should appear together with generated IDs.
- [ ] Define the intended generated-ID status values.
- [ ] Consider a mobile card layout instead of horizontal table scrolling.
- [ ] Define how PNG and PDF downloads will behave when export support is added.

### Dashboard

- [ ] Confirm whether expired IDs should be included in the IDs Generated total.
- [ ] Confirm the definitions used for member, officer, and associate totals.
- [ ] Decide which events qualify as Recent ID Activity.
- [ ] Decide whether metrics should cover all time, the current academic year, or the current organization term.

### Navigation and general interactions

- [ ] Decide whether Settings should remain visible before the settings page exists.
- [ ] Replace inactive buttons with disabled states or clear prototype feedback.
- [ ] Add consistent demo notices or messages when a placeholder action is selected.
- [ ] Review loading and empty states on every page.
- [ ] Confirm consistent button terminology across the application.

### Responsive behavior and visual quality

- [ ] Perform visual review at desktop, tablet, and mobile sizes.
- [ ] Check the Generate ID workspace on small screens with long member information.
- [ ] Verify that the ID preview never creates horizontal page overflow.
- [ ] Review spacing and table density on tablets.
- [ ] Test at increased browser text sizes.
- [ ] Check the interface on common browsers before approval.

### Accessibility

- [ ] Add Escape-key handling and focus management to the mobile navigation drawer.
- [ ] Complete the keyboard behavior and panel relationships for the Front and Back tabs.
- [ ] Verify focus order on all pages.
- [ ] Review color contrast for text, status badges, buttons, and ID themes.
- [ ] Add accessible names or descriptions to all final interactive controls.
- [ ] Confirm that disabled and placeholder actions are understandable without relying only on color.

### Repository and dependency housekeeping

- [ ] Commit the current package-lock name synchronization after reviewing it.
- [ ] Review the dependency audit advisories before deployment.
- [ ] Decide on a deployment environment after the prototype is approved.
- [ ] Add automated component and interaction tests before backend integration.

## Intentionally Deferred

The following capabilities are not defects in this prototype. They were deliberately excluded from the first frontend phase and should be planned only after the UI and workflow are approved:

- Supabase integration
- Database schema and real member records
- Authentication
- Admin authorization and permissions
- API routes
- Real member editing
- Photo uploads
- Canva template uploads
- Cloud storage
- Automatic member ID assignment
- QR-code generation
- Real ID generation
- PNG export
- PDF export
- Persistent generated-ID history
- Template versioning
- Functional settings

## Recommended Next Review Sequence

1. Approve or revise the overall application layout and navigation.
2. Upload the six final Canva ID templates.
3. Test the templates with realistic photos, long names, long roles, and long email addresses.
4. Finalize the Generate ID workflow and all prototype action states.
5. Review responsive behavior and accessibility.
6. Confirm dashboard definitions and generated-ID statuses.
7. Approve the frontend prototype before beginning backend architecture and integration.

## Prototype Completion Definition

The frontend prototype can be considered approved when:

- All five pages match the agreed visual direction.
- The six approved Canva templates are represented accurately.
- Member selection updates all displayed information and ID previews correctly.
- Member, officer, and associate themes are confirmed.
- Front and Back preview switching is clear and accessible.
- Inactive features are clearly communicated as unavailable in the prototype.
- Desktop, tablet, and mobile layouts have been reviewed.
- No important text is clipped or unreadable.
- Stakeholders agree on which features will move into the backend implementation phase.
