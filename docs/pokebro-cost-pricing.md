# Epic Decks / Pokébro: cost register and pilot unit economics
**Prepared:** 27 October 2026 · **Status:** planning estimates, not an approved budget

## Cost principles
Every tool has an explicit cost state: **Already paid**, **Free with constraints**, **Usage-based**, **New recurring cost**, or **Needs quote**. Do not treat existing paid subscriptions as free in SaaS costing; record their full economic cost and incremental impact separately. Never claim a paid marketplace integration is free unless its agreement confirms it.

### Technology and vendors (source-checked October 27, 2026)
| Component | Cost & unit | Status / notes | Official source |
|---|---:|---|---|
| Existing Microsoft Outlook / Exchange Online mailbox | Current bill; incremental €0 if the mailbox/licensing is already suitable | Verify whether `welcome@epic-decks.com` is an Exchange Online mailbox or merely an Outlook client connected to a different provider. Graph Mail.Send requires the right Microsoft tenant and permissions. | https://learn.microsoft.com/en-us/graph/api/user-sendmail?view=graph-rest-1.0 |
| New Microsoft 365 Business Basic license (only if needed) | **€6.07 / user / month**, annual commitment, excl. VAT, NL published price | Don't subscribe until actual mailbox type and rights are known. Pricing/Teams options vary. | https://www.microsoft.com/nl-nl/microsoft-365/business/compare-all-microsoft-365-business-products-b |
| Microsoft Graph sendMail | No separate request price found in Microsoft docs; subject to account/license, Exchange limits and throttling | Needs Azure/Entra registration, application Mail.Send authorization **restricted to designated mailbox** with Exchange application RBAC, admin consent and maintenance. An unscoped app-only grant may access all tenant mailboxes! | https://learn.microsoft.com/en-us/graph/api/user-sendmail?view=graph-rest-1.0 and https://learn.microsoft.com/en-us/exchange/permissions-exo/application-rbac |
| Outlook + Power Automate with standard connector | Often within qualifying Microsoft 365 use rights; confirm tenant entitlement | Useful for inbox notification, labels, approval; premium connectors and externally triggered HTTP workflows can require more licensing. | https://www.microsoft.com/licensing/guidance/Power-Platform and https://learn.microsoft.com/en-us/connectors/office365/ |
| Power Automate Premium if required | **€13 / user / month**, annual commitment, excl. VAT (NL) | Optional. Do **not** assume the HTTP Request trigger is free. | https://www.microsoft.com/nl-nl/power-platform/products/power-automate/pricing |
| Cloudflare Turnstile | **€0** Free tier, within documented tier limits | Needed only for direct submit endpoint; requires server-side Siteverify. Add independent rate limits before production. | https://developers.cloudflare.com/turnstile/plans/ and https://developers.cloudflare.com/turnstile/get-started/server-side-validation/ |
| Vercel Hobby | **$0**, non-commercial projects only | **Not a suitable long-term plan for Epic Decks commercial website** under current Vercel terms. Confirm the actual team plan. | https://vercel.com/docs/plans/hobby |
| Vercel Pro | **from $20/month** excl. VAT and overages, per current pricing | Budget for production; Pro includes a usage credit and additional seats have their own prices. | https://vercel.com/pricing |
| OpenAI API | Token/image/call-based, not included with ChatGPT subscription | Enable budgets/alerts and cost attribution per service or tenant. Existing gpt-4.1-mini currently lists $0.40 input / $1.60 output per million tokens; evaluate newer alternatives after quality tests. | https://developers.openai.com/api/docs/models/gpt-4.1-mini |
| WhatsApp Business Platform Cloud API (later) | Meta message fees by country/category, policy period; platform intermediaries may add markup/subscription | Example unofficial Oct 2026 NL rate cards show ~€0.0414 service/utility and ~€0.1323 marketing; 1,000 service messages per number/month may be free. **Verify official Meta account pricing before budgeting/launch**. | https://business.whatsapp.com/products/platform-pricing |
| Shopify/eBay/Cardmarket/PSA population APIs | Some APIs accessible subject to account/approval; paid vendor aggregators vary | Do not assume universal reseller rights, caching, downloads or transaction fees. Prioritize permissioned adapters and obtain licensing/commercial quotes. | Provider commercial agreements |
| Payment processor, refunds, chargebacks | Variable; subject to provider, payment method, payment flow and country | Obtain a quote once seller-of-record model is defined. | Provider price/contract |
| Domain, transactional logs, database, storage, backups | Depends on current hosting and scale | Account for before storing customer enquiries or user profiles. | Actual invoices / chosen vendors |

### Recommended release sequence by cost
**Stage 0 (now):** client-side sourcing form → user opens their own email app → `welcome@epic-decks.com`. Incremental delivery tech cost **€0** if a functioning mailbox and hosting are already paid for; requires manual sending by the visitor.

**Stage 1 (after verification):** Serverless `/api/sourcing-request` → Cloudflare Turnstile → server-restricted Microsoft Graph Mail.Send → same Outlook inbox. Requires tenant/admin setup, application scope restriction and durable abuse rate-limiting. Additional Graph message charge typically none; hosting/licensing still apply. Backend is **disabled by default**.

**Stage 2:** Outlook Inbox → standard Power Automate rules for foldering/tagging notifications and human reviews. Add AI only for worthwhile incoming requests, with a cost ledger for model tokens/time; do not auto-send offers or commit purchases.

**Stage 3:** WhatsApp Cloud API conversational front-end; pay per chargeable message and operate opt-in/templates/agent guardrails; WhatsApp is not the system of record.

## Buying-agent economics (illustrative assumptions in EUR, not actual cost quotes)
- Average third-party item cost €200.
- Sourcing fee 8% of source price = €16 revenue on successfully fulfilled orders.
- Lead conversion 25% (100 received → 25 completed).
- Human operator cost €20/hour including a *hypothetical* labour valuation.
- 4 minutes triage for every received request plus 12 minutes extra per completed order.
- €20/month assumed allocated infrastructure (just a simplifying **EUR budget input**, not the exact Vercel invoice).
- AI, payment fees, logistics, taxes, returns and marketing **excluded from the first contribution illustration**.

At **100 enquiries/month**, fee revenue = 25 × €16 = **€400**.
Human labor = (100 × 4 + 25 × 12) / 60 × €20 = **€233.33**.
Less €20 assumed infrastructure = **€146.67/month contribution before all omitted costs**.

At **20 enquiries/month**, 5 orders → €80 fee revenue; labor (20×4 + 5×12)/60×€20 = €46.67; less €20 assumed fixed infrastructure = **€13.33** before excluded costs. This low volume case may not justify extra paid tools.

At **100 enquiries/month but 10% completion**, revenue €160; labor (100×4 + 10×12)/60×€20 = €173.33; infra €20 → **-€33.33**, a loss before other costs.

**Lesson:** Conversion and handling time dominate API cost at early stages. Build qualifying questions, transparent minimum fees, and human-in-loop approval before investing in broad AI marketplace research.

### Proposed service packaging to test
- **Free:** Collector Radar discovery & basic sourcing request.
- **Standard:** Buying agent **8% of item source price, minimum €19** on an approved transaction, disclosed before checkout. Do not enforce this commercially until refund/consumer obligations are defined.
- **Premium:** Research/negotiation/checkpoint fee quoted separately; inspection charges need a real labor + packaging + double-shipping cost model.
- **Business SaaS:** Do not set subscription pricing based solely on OpenAI costs. Allocate platform seats, data provider licenses, customer support, security, storage, fraud, refunds, and onboarding. Hypothetical starting range €29–€99/month + processing credits only after testing value.
- **For sourcing through third-party marketplaces:** disclose the source price, transaction role, service fee, platform restrictions and final landed quote, then obtain explicit buyer approval.

### Monthly operating scorecard
Record for every sourcing request: unique ID, acquisition channel, stage, qualification status, operator handling minutes, external listings checked, AI tokens/lookup cost, quote issued, customer acceptance, source item cost, seller-of-record model, sourcing service fee, checkpoint fee, payment charges, shipping costs, refunds, and contribution margin. Use this to compute conversion and profitable minimum fees, segmented by product price.

### Launch gate (not optional)
1. Verify business mailbox is Microsoft 365 Exchange Online, monitored, and capable of receiving mail.
2. Restrict Microsoft Graph Mail.Send to the one designated mailbox. No tenant-wide unscoped app permission.
3. Configure verified Turnstile hostnames, rate limiting/spam protection, alerting and idempotency for form retries.
4. Review and operationalize the updated privacy policy, retention/deletion routine and consent wording before activating the relay.
5. Verify domain DNS/DKIM/SPF/DMARC and reply routing, perform a real deliverability test and check spam folders.
6. Confirm current Vercel plan is suitable for commercial activity and monthly budget alerts are set.
7. Pilot with sample data and manual quotations; do not enable purchases or automatic payments.

**Never commit** API keys, Microsoft client secrets, mailbox credentials, customer enquiries or full inventory acquisition costs to GitHub.
