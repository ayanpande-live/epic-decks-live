# Epic Decks NL — Verified catalogue launch gate

This site is currently a **collection showcase and marketplace referral**, not a
native web shop or independent payment processor.

## Phase 1 — safe, sales-ready links

Goal: publish *only* independently confirmed, owned, photo-ready listings that
already have an active marketplace checkout. Do not treat a listing URL, an old
Cardmarket export, or an Excel quantity as proof that a product is on hand.

For **each SKU**, a founder must confirm:

1. The physical item is in Epic Decks' possession, not sold, not consigned out,
   not reserved and not duplicated across an open Whatnot auction or checkout.
2. Exact product identity, set, year, language, grade, and the grader's certificate
   are checked. A slab scan is evidence only if permitted for reuse; a real
   seller photo of the actual item and the slab label is strongly preferred.
3. Clear front/back images and any defects or slab damage are accurately described.
4. The seller's current price, fees, insured shipping destinations/costs, tax
   treatment and refund obligations have been checked. Never expose purchase cost.
5. The Whatnot listing URL opens to this **specific** SKU and is currently live.
   A store-profile link alone is not sufficient.
6. Set `approved_for_publication=true` only after an explicit founder sign-off.
   Each item must carry verification time in UTC. Verification expires in 14 days
   and must be refreshed after any Whatnot sale, reservation or inventory transfer.
7. Confirm stock against all sale channels before publishing. Selling a unique slab
   on one channel should remove or hold it everywhere else; no automatic sync is
   claimed by this initial release.

## Technical gate (not yet connected to VCT)

- The public page loads `data/public-catalog.json` only.
- An empty feed shows a helpful link to the live Whatnot channel.
- `tools/build_public_catalog.py` takes a **private** JSON array outside this
  public repository and exports an explicit list of approved, reviewed public
  fields. It rejects invalid, stale or unapproved listings and invalid URLs.
- Old workbook/raw exports must not be rebuilt or uploaded. `.gitignore` and
  `.vercelignore` help guard against accidental reintroduction but are not
  permission controls and do not remove historical Git revisions.
- A later VCT integration can generate the reviewed input from its private,
  audited inventory system. No API key or direct database access belongs in
  client-side JavaScript.
- The frontend only accepts direct HTTPS Whatnot listing links. Broader eBay
  destinations and independent webshop checkout require a separate approval and
  inventory/reservation strategy.

## Phase 2 — optional independent checkout (not implemented)

Do not present a payment button before: a payment service/provider is approved,
webhook events are verified server-side, orders/reservations are recorded
transactionally, stock can be atomically reserved, and shipping/VAT/refund
workflows are tested. Never handle card numbers in this static site.

Before direct B2C sales from a Dutch webshop, verify consumer disclosures,
delivery, price including taxes and shipping, return/withdrawal rights and
confirmation flows; Dutch businesses have been subject to an additional
easy-to-find online withdrawal action since June 2026. Check authoritative KVK
and ACM guidance before launching.

- https://www.kvk.nl/wetten-en-regels/online-verkopen-deze-regels-moet-je-kennen/
- https://consument.acm.nl/aankoop-dienst-annuleren/verplichte-informatie-bij-koop-product-dienst
- https://www.ebay.nl/verkoperscentrum/verkopen-op-ebay/accountinstellingen/kosten-zakelijk

## Release and rollback

Review-only: do not merge or deploy until a maintainer confirms (a) the hosting
source and preview, (b) existing private stock exports have been preserved in
an approved private location, (c) no real stock, costs or personal data are in
GitHub public history, and (d) the empty-state UI is acceptable. Removal from
HEAD does **not** erase files from public Git history or caches: site/repo
visibility and history remediation may be necessary as a separate controlled
operation. No live code/data deployment is authorized by this document.
