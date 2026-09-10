# Gold frame front template

Use `awssbg-tipm-front-centered.json` with the supplied 1200 × 1950 gold
AWS SBG 2026–2027 background. The photo opening is mapped at x=338, y=470,
width=528, height=628, with a 54 px corner radius. Coordinates are in export
pixels, independent of the preview's display size.

After deploying the renderer change, upload this JSON with the original PNG
in Templates and save/approve the front template. Updating the repository JSON
does not modify a template already stored in Supabase. Reopen member review
and adjust photo zoom/position if needed, then regenerate the front ID.
Previously generated files retain their original appearance.

The renderer crops the photo to fill this opening and clips its corners in
both previews and generated exports. Omit `photo.borderRadius` (or set it to
zero) for a rectangular photo on other templates. The radius must be between
zero and half the shorter side of the photo region.
