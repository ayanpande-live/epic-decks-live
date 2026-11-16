# Epic Decks V4 — elemental experience, not another themed template

Date: 2026-11-16. Working prototype. No live site changes, inventory import, checkout or publications.

## Design critique that prompted this iteration
V1: too generic, familiar navy-and-gradient template. V2: bold editorial motion, but colours and wordmark divorced from actual brand. V3: real emblem and elemental palette, still a collection of fairly conventional sections and interactions rather than a distinctly memorable experience.

## Design premise
The actual Epic Decks logo is a **four-part elemental emblem around a diamond**. Treat it as a *world-building system*, not a decoration or source of four arbitrary colours.

### Motion and interaction hierarchy
1. **Brand entrance — logo portal**: the full, unchanged emblem is the main visual, with restrained orbiting energy rings and a four-colour ray system. Toggle a stronger energized state on purpose, instead of continuously overwhelming visitors.
2. **Element selection with consequences**: four large touch-friendly cards (Water, Fire, Spark, Mystic) actively change the stage's atmosphere, colour and written explanation. Selection is reversible and has an accessible pressed state.
3. **The Vault as a physical encounter**: a single large card on a stage, pointer tilt on desktop, swipe navigation on mobile, previous/next keyboard-accessible controls and real archived site visuals labelled as such. Only the current image loads; no fake live stock or invented prices.
4. **Editorial transitions**: one branded kinetic ticker and viewport-based entrances; reduced-motion users receive still, legible content.

### Visual system
- Original brand emblem in navigation, hero and closing.
- Midnight ink (#070f1b) / clear off-white (#f7f4ed), with native emblem colours: blue (#21b6e9), yellow (#ffca36), red (#ee535a), violet (#9f66cc).
- Bold display headlines paired with precise compact labeling and editorial whitespace, not repeating box shadows and gradient cards everywhere.
- At high values, actual media, exact product metadata and transparent fulfilment remain more important than animation.

### Prototype
`labs/epic-decks-elemental-experience-v4.html`. Static self-contained HTML/CSS/JS, except assets already committed in the original public website repository. `robots=noindex,nofollow`. No third-party JS, external APIs, behavioural analytics, cookies, account sign-ins, payments or product availability claims.

### Quality and release gates
- Founder feedback and real iPhone + desktop screenshots. Test element selection; energy toggle; swipe; previous/next; pointer tilt; scroll pacing; reduced-motion.
- Preserve keyboard and screen reader behavior; any decorative CSS must not block navigation; mobile must not scroll horizontally at 360/390px.
- Existing logo.webp (~1MB) and archived SVG product imagery (~1–2MB each) are expensive: optimize formats and sizes and apply cache/derivative policy before production; do not embed full-resolution scans in each preview tile.
- No customer data or private master workbook in the public repository. Security issue #38 in VCT remains a launch gate. Rights-cleared product media only.
- Stock-safe export, active channel checks, one-off slab holds, actual checkout/returns, review of business identity/VAT and website SEO all separate from this UI concept.
- Test in browser before calling production-ready; GitHub/Vercel CI success is not visual or user-journey verification.

## Founder review questions
- Does the first five seconds feel like the Epic Decks brand with a wow moment?
- Is element selection genuinely fun on a phone, or does it feel like a colour picker?
- Is a card-centered vault more memorable, easier to shop, and worth keeping?
- Which direction should we push further: immersive motion/3D vs. stronger real-world collector storytelling/photo/video?
