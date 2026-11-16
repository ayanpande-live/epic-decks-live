# Epic Decks NL storefront relaunch — engineering gate (16 Nov 2026)

**Status: code prepared for review, NOT deployed.** The existing public site remains unchanged. This work builds on draft storefront PR #3 and must not be released merely because the inventory spreadsheet is consolidated.

## Product intent
- Dark premium, mobile-first catalogue for NL/DE/BE/FR and later EU markets.
- Clear discovery from organic search/social to exact graded slab, raw singles, sealed and gifts/pulls pages.
- For each product: exact variant/language/grade, authentic approved photo, current availability, visible VAT-inclusive consumer price, shipping/returns and real checkout **only after** payment, reservation and fulfilment paths are tested.
- Otherwise offer an honest enquiry or verified external marketplace link, **not** a fake add-to-cart or untested checkout.
- Keep Whatnot/Cardmarket/eBay live commercial links; don't imply automated stock sync or unsupported grading/image rights.
- No live inventory file, acquisition costs, certificate-source data or order records in this public repository.

## Stock-safe catalogue contract
The isolated \`assets/public-catalogue.mjs\` module returns an **allowlisted** public view (title, variant, language, grade, image, price, approved link) only if ALL gates pass:
1. Explicit founder publication approval.
2. Unique per-slab unit key; no duplicate record (single-copy slabs only for this slice).
3. Available, not reserved/sold, channel check passed.
4. Recent availability check (24h default, configurable).
5. Seller-owned or explicitly licensed hero image.
6. Positive approved public price.
7. External sales link only when HTTPS or safe local path; no direct website checkout in this slice.

**Caution:** This is a deterministic *export gate*, not live inventory locking. Before live commerce, wire authenticated VCT stock events / marketplace reconciliations, atomic one-of-one holds, payment status and cancellation flow. Do not serve the private input or excluded diagnostics in browser JS.

## Work independent of the master file
- Homepage/navigation redesign from PR #3, accessible mobile filters, collector-oriented content and localized metadata.
- Ship website SEO essentials: sitemap, canonical URLs, structured data only for verified eligible public products, Bing and Google indexing baselines.
- Product media pipeline: hash reuse, compressed variants, origin/source attribution and licence decisions; store only necessary images.
- Offer enquiry path with actual monitored email delivery tests before public conversion claims.
- Validate EU consumer checkout obligations before enabling online payments: business identity, accurate price/VAT, fulfilment and returns, statutory cooling-off / cancellation functionality, privacy and consent. See https://business.gov.nl/regulations/long-distance-sales-and-purchases/ and https://business.gov.nl/amendments/online-shops-must-have-cancellation-button/ .

## Release acceptance, not yet proven
- Test catalogue from synthetic fixtures and private inventory preview (never paste acquisition costs into public repo).
- Mobile widths 360/390 px and desktop; keyboard, accessible labels, empty/sold states, broken image fallback, Core Web Vitals.
- Product page links match active availability; checkout or enquiry end-to-end verified; one-of-one item cannot sell twice.
- Founder reviews public copy, donation claims, photos, return policy, canonical domain/DNS and release; deployment only with explicit approval.

## Run
\`node assets/public-catalogue.test.mjs\`

Do NOT claim the module is yet wired into the deployed homepage.
