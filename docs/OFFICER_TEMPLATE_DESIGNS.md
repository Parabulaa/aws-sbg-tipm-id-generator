# Officer template designs

Templates has eight independent officer design cards: Executive, Buildhers,
Relation, Operation, Marketing, Finance, Creatives, and Technology. Each has
separate front/back slots and an enlarged private preview. Member front and back
have their own section. The unused shared-template and team-color controls were
removed because the approved PNG artwork already defines every office's color.
Empty slots show an upload prompt; the app does not manufacture artwork.

## Database setup

Apply `supabase/migrations/20260911000100_officer_template_designs.sql` through
your normal Supabase migration workflow before saving the new templates.
It adds a team column and replaces category/side uniqueness with
category/side/team uniqueness. Existing records remain shared templates.
Existing RLS and private Storage permissions are preserved. No secrets are needed
in the frontend and no new storage bucket is required.

## Upload and review

As Admin, open Templates → Configure an approved template. Select Officer,
choose the officer design and side, then upload its 1200 × 1950 PNG. Front uploads
also require the matching JSON; back uploads do not. Confirm approval and save.
Repeat for the supplied designs. Select Member to save its independent front or
back. Officers can view but cannot change templates.

Preview and generation select the design from the officer's controlled position.
AI/ML Lead and Software Engineering Lead use Technology / CTO Office.
If a team side is absent, an approved shared Officer side is used if available;
another team's artwork is never selected. LORSO belongs to Executive and uses its design.
Apply migration `20260911000200_lorso_executive_office.sql` to correct the database mapping.
Existing generated files
are unchanged; regenerate to use newly uploaded designs.
