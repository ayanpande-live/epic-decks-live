# Universal Inventory Intake — pilot

**Purpose:** Accept different seller starting points and normalize them into one **review-only** inventory format. This is not yet a synced multi-tenant SaaS.

## Entry points (same preview deployment)
- New slabs: `/tools/iphone-intake/index.html`
- Existing inventory: `/tools/inventory-import/index.html`

## Supported pilot imports
- Excel .xlsx/.xls, with worksheet picker and configurable header row
- Generic CSV / TSV / semicolon-delimited files, with field mapping
- Shopify product export CSV (groups additional image rows by Handle; preserves variant SKU separation)
- Whatnot inventory templates / seller-provided CSV **when available** — schema must be reviewed. We have not established an official full listing export/API for every seller.
- Cardmarket authorized stock API export or independently prepared CSV. Not an unrestricted Cardmarket account connector.
- Existing iPhone Slab Intake JSON exports
- Existing website's `data/inventory.json` `all_items` array as a staged import

All data is processed in the browser, in memory; the only file generated is an optional locally downloaded **review JSON**. The tool does not call Shopify, Whatnot, Cardmarket, or a database; never publishes and never updates live stock.

**Excel dependency:** the pilot loads a version-pinned SheetJS library (0.20.3) from the official CDN. Before importing confidential commercial data in production, **vendor and audit** the parser instead of relying on mutable third-party code. The preview must remain access-protected and is for dummy/test inventory only at this stage.

## Quick preview test
1. Open the latest Vercel Preview deployment for branch `feature/universal-inventory-import-20261025`. Do not use production.
2. Append `/tools/inventory-import/index.html`.
3. Upload `tools/inventory-import/example-shopify.csv` or your own sanitized CSV.
4. Review automatically suggested column mapping; override incorrect columns.
5. Click **Add reviewed import to staging**, inspect records and duplicate warnings, and export JSON.
6. Optionally add another different file in the same session to test cross-source overlap.
7. Test photo workflow separately. Export iPhone JSON and import it here.

## Canonical inventory record (v1)
- `identity`: SKU, grader, grade, certificate, title, set, number, language, item type, condition
- `stock`: quantity
- `commercial`: price, currency, acquisition cost (private)
- `content`: description, image URLs and original listing URL
- `source`, `source_id`, `source_account`, `provenance`, `raw` source row
- `warnings`, `possible_duplicates`, `review_status: needs_review`

**Do not merge duplicate suggestions automatically.** In particular, one slab can legitimately have different listing IDs on several channels. The canonical *physical unit* should remain unique, but external listing records and channel-specific prices must remain separate. Neither a shared product title nor a matching SKU always proves physical identity.

## Commercial SaaS architecture (future)
A production build needs tenant and user tables, tenant-scoped authentication and storage, encrypted connector credentials, imports with idempotency keys, row-level permissions, an inventory ledger (hold/available/sold), source listing references, sync events, an audit trail, and tenant-specific deletion/export controls. Account API connectors must respect each platform's terms.

Suggested stages: (1) reliable file migration and human review, (2) multi-file reconciliation and photo enrichment, (3) Shopify OAuth and approved read-only catalogs, (4) Whatnot official Shopify-channel integration for eligible customers, (5) approved Cardmarket integration where possible, (6) selling-channel publishing and reconciliation after extensive test coverage.

## Local developer smoke test
`node --test tools/inventory-import/normalize.test.mjs`
or `node tools/inventory-import/normalize.test.mjs` on an ESM-compatible Node version.

## Handling source data
Do not commit real inventory files, credentials, purchase prices, or exported review JSON to this public repository. Earlier repository history includes a private inventory workbook; deleting it in a later branch does not erase it from history. Secure backups and proper repository/history remediation remain necessary.

## No claims of API verification
This importer performs **no paid grader lookup or automatic photo AI**, and does not imply inventory is certified, real-time synchronized, or sale-ready. All records require review.
