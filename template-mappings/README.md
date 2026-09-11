# Front mappings for the supplied office artwork

Use each JSON with the corresponding original 1200 × 1950 PNG. Do not reuse
the previous gold mapping for every office. These mappings follow the supplied
frame openings; text starts below the frames. No member records are included.

Back designs contain no generated fields. The website accepts the completed back
PNG directly and creates an empty layout automatically. No back JSON is needed.

| Office | Artwork | JSON | Photo x, y | Width × height |
| --- | --- | --- | --- | --- |
| Executive (including LORSO) | Emerald | executive-front.json | 362, 476 | 476 × 591 |
| Operations | Gold / khaki | operations-front.json | 338, 470 | 528 × 628 |
| Buildhers | Pink | buildhers-front.json | 356, 472 | 488 × 602 |
| Marketing | Pink / green | marketing-front.json | 387, 452 | 465 × 578 |
| Technology | Blue / pink | technology-front.json | 324, 501 | 557 × 615 |
| Finance | Purple | finance-front.json | 373, 502 | 477 × 590 |
| Relations | Navy blue | relations-front.json | 335, 451 | 508 × 598 |
| Creatives | Red | creatives-front.json | 370, 519 | 489 × 582 |

## Apply

1. Wait for the renderer update to deploy. Apply the officer-template migration
   if still pending and the new LORSO migration in Supabase.
2. In Templates, choose Officer, the matching office, and Front.
3. Upload that office's PNG and JSON together and save/approve.
4. Reopen review. Reset photo position and adjust zoom/reposition as necessary.
5. Save the member and regenerate. Old generated files do not change.

Executive, Buildhers and Finance use normalized `clipPolygon` points to follow
frame cut-ins as well as rounded corners. Other designs use `borderRadius`.
The same clipping and aspect ratio are used by the photo editor and ID renderer.
Coordinates apply only to these exact supplied artworks. Check the regenerated
PNG at full resolution before printing; resized or revised artwork needs a new mapping.

## Keeping photos consistent

Upload the original portrait without stretching it or pre-cropping every person
to one office's frame size. The renderer fills each mapped opening while keeping
the portrait's proportions. Start at zoom 1, then adjust to leave headroom.
The Member template remains independent; pair it with its own mapping.

For future template revisions, keeping every photo opening at the same position
and size simplifies maintenance. For irregular frames, a transparent photo opening
and foreground frame layer is another reliable design approach, but these current
opaque PNGs require the supplied clipping mappings.
