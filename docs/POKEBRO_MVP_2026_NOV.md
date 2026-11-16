# Pokébro MVP — staged development and safety gates (16 November 2026)

**Draft code only; not a working WhatsApp bot, a paid subscription or a live purchasing service.**

## Reuse what exists
- Draft sourcing concierge PR #4 already has a responsive sourcing-request form, budget/grade/country fields, a copyable structured brief, safe email draft fallback and WhatsApp deep-link only for a verified business phone number.
- Do not enable SES, WhatsApp, automated communications, payments, or a live marketplace purchase flow without explicit founder approval and security/consent checks.
- Treat assets/pokebro-quote.mjs as independent deterministic **quote calculation** for a researched candidate. It does not invent market prices or fetch listings.
- Do not expose private inventory costs or founder supplier relationships in public source/JS.

## First release experiences
1. A user states an exact Pokémon collectible or flexible budget/goal, product form (graded/raw/sealed), language/variant and destination.
2. System requests or researches candidates via permitted sources and creates an evidence record. Exact printing/condition/grade comparisons; distinguish active asking prices, verified sold comps and assumptions.
3. Human-reviewed candidate details include source URL and checked date, full landed-cost quote and seller-of-record/cross-border handling. No result is labelled available solely because a stale listing exists.
4. A customer may request a sourcing quote or watchlist notification after explicit communication consent. Purchase, retailer sourcing, inspection and delivery remain separate future legal/payment work.

## Quote calculation acceptance
- Nonnegative EUR item price, seller shipping, duties, nonrecoverable import VAT, inspection, outbound shipping, service fee and other costs are all explicit; zero is allowed. Missing values fail closed.
- Budget fit evaluated with integer cents; no automated buy/pass action, inventory reservation or profit claim.
- Source URL/date and known seller-of-record mandatory to mark ready for human quote review.
- If VAT/import treatment, product identity, fulfilment risk or resale evidence is unknown, disclose uncertainty; don't present hypothetical scenarios as final prices.
- Display fee and terms transparently before taking any payment; do not assume consumer prepayment, tax treatment or returns are already solved.

## Next build after pure quote engine
- Candidate evidence schemas with provenance/date/licence and ageing/availability checks.
- Permissioned provider integrations + source caching and rate limits; no unauthorized scraping.
- Watchlist/Radar with opt-in notifications, deletion and opt-out.
- Pilot with 5–10 trusted collectors, explicit manual quotation and fulfillment; measure useful matches, quote acceptance, repeat usage and unit economics **before** full WhatsApp automation/subscription billing.
- Shared card identity service may reuse approved VCT logic, but Pokébro customer data is isolated from Epic Decks stock and TC proprietary trade data.

## Validation
Run node assets/sourcing-request.test.mjs and node assets/pokebro-quote.test.mjs.
No live send, checkout, offer or customer ingestion is enabled by these files.
