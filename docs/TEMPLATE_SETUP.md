# Approved template setup

Generation uses six fixed template slots: Member, Officer, and Associate, each with front and back. Only an Admin can upload or replace them. Images live in the private `id-templates` bucket; mappings live in PostgreSQL.

Upload an approved PNG at exactly 1200 × 1950 pixels with its JSON mapping on the Templates page. The repository intentionally contains no invented replacement designs.

## Mapping format

- `photo`: optional `{ "x", "y", "width", "height" }`; required on front templates.
- `fields`: text rectangles with `field`, coordinates, `fontSize`, `minFontSize`, `color`, `align`, and `weight`.
- `accents`: approved recolorable rectangles; optional `label` text receives contrast-safe black or white.

Supported canonical fields are `full_name`, `tip_email`, `student_id_number`, `program`, `year_level`, `aws_sbg_id`, `membership_type`, `officer_position`, `team`, `date_issued`, and `valid_until`. The legacy mapping aliases `name`, `email`, and `role` remain supported so an existing approved mapping can be migrated without a redesign.

Fields render only when the mapping contains them. Do not flatten dynamic names/photos into the background and do not mark logos or fixed artwork as accent regions. Verify both sides, long names, officer roles, email, dates, and real photos before bulk production.
