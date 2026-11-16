# Collector Cockpit V2 — visual exploration (16 Nov 2026)

Status: draft prototype only, not the relaunch and not published to epic-decks.com.

## Feedback addressed
V1 felt like a recognizable AI-template colour scheme with insufficient visual energy and memorability. V2 deliberately rejects navy/purple gradient-card design and uses an editorial collector-culture aesthetic: near-black ink #0a0b09, warm paper #f4efdb, high-visibility acidic lime #d6fa56 and intense orange-red #ff5935. Headlines are compressed, oversized and unapologetic. Fine grid/scanner details, sharply cut calls to action and a high-contrast lime ticker create a stronger identity.

## Motion strategy, not decoration
- A 3D slab is driven by pointer position with limited tilt. An explicit Flip button works on touch and keyboard.
- Lighting position can be adjusted by a native input range control; no device-orientation access or sensor permissions.
- Soft orbit animation and horizontal type ticker communicate collector energy. They respect prefers-reduced-motion.
- Scroll entry reveals run through IntersectionObserver, with a no-JavaScript/unsupported fallback to static content considered for the eventual production release.
- Gallery cards react on hover; search, grade selector and reset are usable on touch.

## Scope of this experiment
Preview at /labs/collector-cockpit-v2.html.
Uses existing publicly committed archive images for art-direction evaluation only, with conspicuous unverified-stock disclaimers. The image-rights and public repository data exposure issues must be remediated before production. No price, stock quantity, sales promise, automated sourcing, payment or checkout functionality exists.
No external animation dependencies or font-loading libraries added. Optimizing/archive re-encoding is a priority before real product pages since existing SVG images can be megabytes each.

## What to review
1. Overall brand distinctiveness: editorial, energetic, collector culture rather than stock SaaS styling.
2. The hero's slab flip, 3D tilt and lighting slider on mobile and desktop.
3. Readability, touch targets, correct archive labels, search and grade filter.
4. Actual device rendering, reduced-motion system settings, mobile scroll performance and excessive animation distraction.
5. Brand legitimacy for premium items: imaginative but not deceptive or juvenile.
6. Prefer to include one user-approved real product photography set in the next preview, then live inventory only after stock-safe private export.

## Release and security gates
No merge to main or publish to canonical domain without founder review. Preserve old site. Site security issue VCT #38 must be resolved before integrating private inventory; VCT identity/stock controls and commerce checks are separate gates. This is not evidence that PR #6 or its parent PR #3 are production ready.
