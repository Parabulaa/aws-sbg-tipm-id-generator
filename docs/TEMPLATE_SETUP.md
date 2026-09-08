# Approved template setup

No approved Canva PNGs were included in the build specification or existing public assets. The renderer does not invent replacements. To finish organization-specific integration, supply Member, Officer, and Associate front/back PNGs at exactly 1200 × 1950 pixels and confirm the matching dynamic field coordinates.

In Templates, expand **Configure an approved template**. Select category and side, upload the PNG and its JSON field mapping, confirm approval, and save. The configuration and image are persistent. This is initial installation configuration, not a Canva API integration or full visual editor.

## Mapping format

All coordinates are in the fixed 1200 × 1950 canvas space. The JSON object contains:

- `photo`: optional rectangle `{ "x": number, "y": number, "width": number, "height": number }`. Required on front templates.
- `fields`: array of text rectangles with the same coordinates plus `field`, `fontSize`, `minFontSize`, `color`, `align`, and `weight`.
- `accents`: array of approved colorable rectangles. An optional `label` uses automatically selected black/white text. Leave empty if no region may be recolored.

Allowed text fields: `name`, `role`, `aws_sbg_id`, `email`, `date_issued`, `valid_until`, `team`. Front templates require name, role, ID, and email. `align` is left, center, or right; `weight` is normal or bold. Text colors use six-digit hex values. Minimum font size must be at least 12 canvas pixels, and maximum configured size is 180.

The coordinate mapping must come from the approved layout. Do not guess locations over a flattened background. Export backgrounds with blank dynamic text/photo areas to avoid doubled names and photos. Never map logos or fixed branding as colorable regions. If approved color changes require irregular artwork, supply an approved design with rectangular color regions or extend the renderer after review; this version supports rectangular accent regions only.

An officer must verify real photos, long names, multiword surnames, positions, emails, and both sides before bulk production. Exact visual approval remains pending until the six organization assets and their mappings are supplied.
