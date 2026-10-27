# Pokébro Sourcing Concierge — Release 1 preview

**Branch:** `feature/pokebro-sourcing-concierge-20261027` (based on the unmerged storefront preview). Production remains unchanged.

## Routes
- `/collector-club.html` — Collector Radar, experimental discovery.
- `/sourcing.html` — structured sourcing request and manual handoff.
- `/assets/sourcing-request.mjs` — shared, strictly normalized and validated request contract.
- `/data/concierge-config.json` — configuration for **verified** Epic Decks WhatsApp number, intentionally blank.
- `/assets/sourcing-request.test.mjs` — validation and handoff regression tests.

## What works right now
1. Collector enters exact card or flexible sourcing request, budget in EUR, delivery country, desired grader/grade/condition, optional sample listing and shipment preference. Alternatively, Collector Radar can transfer relevant preferences using one-time, same-tab session storage; the transfer is deleted as soon as the sourcing page loads.
2. A reviewable brief is prepared **locally in the browser**.
3. The collector can copy the brief or open an email draft to the published Epic Decks contact mailbox (`welcome@epic-decks.com`). Opening a draft does not send it; confirm the inbox receives and is monitored before launch.
4. The direct WhatsApp button is automatically **disabled** unless `whatsapp_phone_digits` is configured with a real, verified business number in international digits (no `+`). Once configured, the button opens a user-editable chat through an official `wa.me` link. The user must explicitly press Send in WhatsApp.
5. A disabled-by-default Microsoft 365 Graph email relay has been scaffolded at `/api/sourcing-request.js`, behind Turnstile, same-origin checks and explicit consent. It requires a verified mailbox, server environment secrets, secure mailbox-restricted Graph application permission, abuse rate limiting and privacy/retention checks. Until activated it returns a not-configured response and customers use email drafts. No marketplace search, quote, or transaction is initiated.

## Outlook-first relay setup and financial review

- **Stage 0** (usable now): Draft email opened in the visitor’s email program. No direct submission or marketing opt-in.
- **Stage 1** (not yet activated): Confirm `welcome@epic-decks.com` is a Microsoft 365 **Exchange Online** mailbox, not merely an Outlook client configured for IMAP/SMTP or another host. In Microsoft Entra create a **dedicated** service principal, restrict Graph application Mail.Send to the single mailbox using Exchange app RBAC, and separately enable anti-abuse rate limiting. Admin consent is necessary. Never place Microsoft credentials in browser code or GitHub.
- Before enabling Vercel Preview environment, configure `SOURCING_EMAIL_RELAY_ENABLED=true`, `MS_TENANT_ID`, `MS_CLIENT_ID`, `MS_CLIENT_SECRET`, `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`, `TURNSTILE_ALLOWED_HOSTNAMES` (comma-separated exact approved preview hostnames). Use different credentials in production. **Keep relay disabled** until the mail scope, security and privacy gate is satisfied.
- The test endpoint responds `GET /api/sourcing-request` with `enabled:false` before configuration. Microsoft Graph `202 Accepted` means it accepted a send request, **not that the email was delivered**. Verify Outlook inbox and deliverability manually.
- Recommended optional automation: Microsoft Outlook rules or Power Automate standard trigger "When a new email arrives (V3)" to file incoming sourcing messages, set a human review task, and eventually draft but **not send** AI-assisted customer replies.
- Cost assumptions, official price links, and service-fee profit scenarios: [Pokébro cost register](./pokebro-cost-pricing.md).

## Prerequisites before connecting WhatsApp
1. Confirm the exact business phone number and that the business controls the corresponding WhatsApp/WhatsApp Business account. Do **not** commit account credentials or access tokens to a public repository.
2. For simple click-to-chat, update `whatsapp_phone_digits` in the preview configuration after verifying the destination on a test device.
3. For actual agentic messaging, set up a Meta business portfolio, WhatsApp Business Account, and compatible business phone number, then connect **WhatsApp Cloud API** with webhooks, explicit customer opt-ins for proactive alerts, approved templates outside open service windows, and appropriately secured secrets. The phone number can be separate from the click-to-chat number if needed.
4. Separate human-operated customer service, agentic suggestions, and transaction-authorized actions. Never have an unrestricted agent initiate payment, purchase, refunds, or inventory commitment.


## Outlook-first channel: delivery, costs, and rollout

We have confirmed via the connected Outlook account that \`welcome@epic-decks.com\` is the correct business mailbox. **The ChatGPT Outlook connection does not supply Vercel with an API credential.** For secure unattended sends, a Microsoft 365 Exchange Online admin must configure an appropriately scoped Graph application and server-side credentials separately.

The development site supports:
- **Ready now**: client-generated, prefilled email draft addressed to the Epic Decks mailbox. The customer must send it themselves.
- **Implemented but disabled by default**: \`/api/sourcing-request.js\`, which would securely forward a website enquiry via Microsoft Graph from the Epic Decks mailbox after CAPTCHA, consent, origin and input validation. This does not yet send any messages because the environment permissions/security gates are not configured.
- **Not yet implemented**: idempotent persistent request tracking, automated customer acknowledgements, quote generation, order tracking, database retention and full WhatsApp conversation service.

**Mandatory before enabling**: Exchange RBAC mail.Send scope restricted to the business mailbox, Cloudflare Turnstile, verified edge rate limiting, true flags \`SOURCING_GRAPH_SCOPE_VERIFIED\` and \`SOURCING_RATE_LIMIT_READY\`, then \`SOURCING_EMAIL_RELAY_ENABLED\`, plus \`MS_TENANT_ID\`, \`MS_CLIENT_ID\`, \`MS_CLIENT_SECRET\`, \`TURNSTILE_SITE_KEY\`, \`TURNSTILE_SECRET_KEY\`, \`TURNSTILE_ALLOWED_HOSTNAMES\` set securely on Vercel. Configure **Preview only**, test, monitor and review privacy policy/consent text before production. Do not share credentials in chat or GitHub.

Microsoft Graph returning HTTP 202 does not guarantee inbox delivery. An operator must check \`welcome@epic-decks.com\`. The site still has a click-to-compose fallback.

**Pricing and P&L document:** \`docs/pokebro-cost-register-20261027.md\` lists existing subscriptions, potentially paid services, vendor prices as of 27 Oct 2026, unit-cost assumptions, profitability tests, and explicit purchase/activation checkpoints. Do not add paid plans or enable direct transactions until approved.

## Suggested request workflow and state machine
`draft → received → needs_clarification → sourcing → options_ready → quote_issued → buyer_approved → payment_pending → purchased → shipping → [optional inspection] → delivered → closed`.

Possible alternate states: `declined`, `expired`, `unavailable`, `cancelled`, `disputed`. All state changes need actor identity, timestamps and audit logs once storage exists.

**Request entity**: request ID, tenant/business ID, collector ID (only with consent/account), chat channel, criteria, maximum landed budget, shipping preference, state, created/updated timestamps, expiry, communication consent, and optional buyer-visible notes.

**Sourcing candidate**: platform, seller ID, link, item/card identity, grading company/cert, description and photos **where permitted**, source price/currency, estimated shipping, taxes/duties, listing observed time, stock check status, permissions, risk flags, and match explanation. Never claim authenticity or verified inventory based solely on scraped text.

**Quote**: selected candidate ID, seller of record, principal vs agent legal capacity, source price, shipping legs, duties/taxes (estimated or confirmed), sourcing service fee, optional inspection fee, payment-provider fee where applicable, price currency, validity/expiry, cancellation/refund terms, written human review and buyer approval. No quote can be sent without price-source verification.

**Order**: buyer approval event, payment-provider transaction reference, permitted external purchase reference, fulfillment/inspection events, and return/dispute audit trail. Use a payment services provider; do not hold customer funds in an improvised escrow.

## What we should build next (after preview feedback)
- Authenticated request intake and private CRM dashboard. Start with Outlook inbox only once mailbox scope and privacy/security steps are complete.
- Read-only search adapters for supported marketplaces + Epic Decks inventory, strictly respecting their terms.
- Assisted research: compare options and calculate landed cost; present true tradeoffs and clearly identify commercial fees.
- Quote review and approval (human operator first) and secure payment links.
- WhatsApp Cloud API webhook agent with idempotency, rate limiting, structured replies, consent, logging and escalation.
- Optional paid Epic Checkpoint service with a published inspection checklist and chain-of-custody trail.
- Approved, opt-in alerts from Collector Radar watchlists.

## Business model hypotheses
1. Sourcing concierge (flat minimum + percentage of purchase value);
2. Separate disclosed inspection/forwarding fee;
3. Direct buyer/seller facilitation for approved partner inventory (platform commission);
4. Potentially premium collector memberships after delivering proven value.

Measure: received requests, qualified leads, quotes issued, acceptance rate, fulfilled requests, contribution *after* sourcing time/payment/shipping/inspection costs, issues and repeat customer requests.

**Caution:** Being the seller of record vs a disclosed buying agent has different tax, consumer, and fulfillment obligations. Confirm marketplace/API agreements and Netherlands/EU rules before collecting third-party transaction payments. Cardmarket access is not assumed; paid or authenticated marketplace scraping is not an acceptable fallback.

## Test this safely
Open the Vercel preview deployment of this branch (do not use production), then `/sourcing.html`.
Fill in a fictional sample request such as PSA 10 Umbreon, up to €250 delivered to the Netherlands, choose compare routes, then Prepare. Copy the brief or open an email draft. The WhatsApp button should stay **disabled** until the real business phone is verified. Do not include contact details, private addresses or payment information in test requests. No automatic order will be placed.
