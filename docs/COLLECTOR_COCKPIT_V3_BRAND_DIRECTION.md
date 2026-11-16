# Collector Cockpit V3 — brand-led elemental design direction
Date: 16 November 2026. Status: standalone draft preview, not deployed to the production Epic Decks domain.

## Founder feedback
After previewing V2, founder shared the actual full-colour Epic Decks elemental emblem and noted that the current mock felt disconnected from the brand. The logo is the primary visual asset: blue/grey outer ring, gold/yellow and red-purple flames, gem/diamond centre, and integrated white Epic Decks lettering. The repository's existing `/images/logo.webp` was checked visually and matches the uploaded emblem, so no approximation was commissioned.

## V3 changes
- Navigation uses the full existing Epic Decks logo instead of a made-up lettermark.
- Hero stage repeats the emblem as an atmospheric brand seal behind an interactive archive slab; the logo itself remains intact.
- A reversible elemental selector (Water cyan, Fire red, Spark gold, Mystic violet) changes stage light and accent without replacing brand artwork.
- Deep midnight blue, cool off-white and restrained accents drawn from the emblem replace V2's unrelated acidic-lime styling.
- The headline keeps expressive typography; ticker and panels carry brand language rather than unrelated gaming/cyberpunk clichés.
- Preserve touch-accessible slab flip, desktop pointer tilt, lighting slider, search/filter/reset, reveal and reduced-motion behavior.

## Restrictions and quality gates
- Preview: `/labs/collector-cockpit-v3.html`; never advertise this as current store stock.
- Uses existing public repository `/images/logo.webp` and preexisting archive card images, not newly purchased media or private master inventory. No new backend, tracking, checkout, messages, user data or accounts.
- Existing logo asset is approximately 1MB. Optimize responsive logo delivery and card images in the next production slice to avoid bandwidth costs and mobile performance regressions.
- Run static checks, then actual browser/device QA; inspect the 360/390px layout, iPhone touch, readability, shadow/contrast, and whether emblem placement competes with the slab.
- Follow stock privacy/security gates VCT issue #38, verified availability, rights and release approval before any public launch. Do not merge parent PRs automatically.

## Design decision requested
Does the brand-led elemental system now feel like *Epic Decks*? If yes, refine toward a flagship editorial + interactive product journey. If no, reassess composition/typography while keeping this original logo, rather than inventing another arbitrary visual identity.
