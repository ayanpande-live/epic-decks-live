# Epic Decks NL + Pokébro — cost register and pricing gates (27 October 2026)

**Scope:** Internal Epic Decks NL operating costs AND wholesale / SaaS unit economics if the tooling is later offered to third-party card businesses. These are **planning assumptions**, not actual account invoices. All figures exclude VAT unless otherwise stated; provider currencies are retained. Never convert USD to EUR without a dated FX rate.

## Cost discipline and approval rules

1. Prefer already-owned tools and no-additional-subscription routes.
2. Every external service must be marked as **existing cost / incremental recurring / variable metered / one-time / manual labor / unverified**.
3. Keep pilot fixed incremental spend at **€0** until an actual deliverability/security requirement forces a paid service. Do not confuse existing subscription costs with zero cost of ownership.
4. Require explicit business approval before adding any billable plan, automated purchase, grader API credit purchase, marketing template, WhatsApp BSP, or payment provider.
5. Configure **hard budgets, caps or alerts**, where available. Never assume spending is limited merely because it is in preview.
6. For each transaction, record all-in cost and **contribution**, including manual sourcing time, platform fees, payment charges, exchange fees, shipping, VAT/tax treatment, dispute/returns allowance and inspection labor.
7. Do not announce customer pricing, paid inspection, or cashback incentives before contract, consumer-rights, tax and insurance review.

## Tool and service register

| Tool | Use | Published/estimated provider price | Epic Decks initial decision | Cost classification |
|---|---|---|---|---|
| Microsoft 365 Outlook/Exchange Online | Primary inbox \`welcome@epic-decks.com\`, request handling | Existing mailbox account **already connected**. If separately licensed, Dutch M365 Business Basic advertised at **€6.07/user/month annual billing**, **€7.28 monthly billing** (ex VAT); exact tenant SKU must be verified. https://www.microsoft.com/nl-nl/microsoft-365/business/with-teams-plans-and-pricing | Reuse existing mailbox; no new account requested | Existing fixed |
| Microsoft Graph API | Backend sends approved form requests via Microsoft 365 | No separate per-email Graph charge shown for standard \`sendMail\`; **subject to mailbox licensing, API permissions, throttling and availability**, not an unlimited email gateway. https://learn.microsoft.com/en-us/graph/api/user-sendmail | Use server-side app identity ONLY after security review | Included usage / limits |
| Exchange Online Application RBAC | Scope Graph Mail.Send to \`welcome@\` rather than all tenant mailboxes | Typically a configuration/security task, not an independent message charge. Requires admin time. https://learn.microsoft.com/en-us/exchange/permissions-exo/application-rbac | **Mandatory before production auto-send** | One-time setup |
| Microsoft Power Automate (optional) | Mailbox tagging, operator notification, acknowledgement, status and follow-up reminders | Some eligible Microsoft 365 licenses include standard connectors/limited rights; **Premium $15/user/month billed annually** if needed for premium workflow. https://www.microsoft.com/en-us/power-platform/products/power-automate/pricing | Defer paid license until email flow shows traffic | Potential new fixed |
| Cloudflare Turnstile | Bot challenge on public contact form | **Free** plan for most small businesses, up to 20 widgets and 10 managed hostnames/widget. https://developers.cloudflare.com/turnstile/plans/ | Free tier | Free under limits |
| Vercel | Website previews and serverless relay | Hobby is **noncommercial**; Pro advertises **$20/month + metered excess**, with $20 usage credit. https://vercel.com/pricing ; https://vercel.com/docs/plans/hobby | Confirm actual Epic Decks plan; do NOT budget commercial use at Hobby $0 | Fixed + variable |
| OpenAI API | AI card extraction, potential sourcing summaries and messages | **Token-based**, separate from ChatGPT subscription. GPT-4.1-mini published **$0.40 input / $1.60 output per million tokens**; image/token consumption depends on actual workload. https://developers.openai.com/api/docs/models/gpt-4.1-mini | Human-led email pilot needs **no AI API for sending**; log future tokens by request | Variable |
| WhatsApp Business Platform — later | WhatsApp agent conversations and proactive alerts | Starting 1 Oct 2026, per-message charges for outbound service and templates; first **1,000 service messages/phone/month free** per recent provider documentation; rates vary by destination & category. Use Meta's live official rate card at provisioning. https://support.wati.io/en/articles/16954666-whatsapp-business-platform-api-pricing-changes-service-messages-and-click-to-message-ads | Do not set up paid BSP until needs are proven; avoid high message counts by bundling responses | Variable |
| Twilio BSP (optional) | Hosted WhatsApp API onboarding and routing | Advertises **$0.005 per inbound/outbound message** on top of Meta charges, excluding add-ons, as of Sep 2026. https://www.twilio.com/en-us/whatsapp/pricing | Compare against direct Meta Cloud API; not selected | Optional variable |
| eBay / Cardmarket / grader API | Authorized sourcing, verification, pop reports | Access rights and fees **not confirmed for our commercial usage**; pricing/licensing may vary; scraping is not a substitute | No paid integration until permitted and costs are known | Unverified |
| Payment provider (later) | Sourcing fee capture, seller marketplace payment | Provider/card/country/method-dependent; no authorization today | Avoid handling customer funds until checkout and legal structure approved | Variable |

**Outlook connection distinction:** The Outlook plugin connected to ChatGPT confirms we can work with this mailbox in a chat, **but that connection does not grant the public Vercel website a Microsoft Graph token or server credentials**. Separate Microsoft tenant/admin setup is still required.

## Production gating for the website relay

The existing \`/api/sourcing-request\` endpoint is explicitly disabled unless all are true:

- \`SOURCING_EMAIL_RELAY_ENABLED=true\`
- \`SOURCING_RATE_LIMIT_READY=true\` (**external effective rate limiting actually configured**, not merely a toggle)
- \`SOURCING_GRAPH_SCOPE_VERIFIED=true\` (**tenant admin has verified mail.send can only act for the permitted Epic Decks mailbox**, not broad unscoped organization consent)
- \`MS_TENANT_ID\`, \`MS_CLIENT_ID\`, \`MS_CLIENT_SECRET\` are stored as **server-side secrets**, with the client secret rotated as needed.
- \`TURNSTILE_SECRET_KEY\`, \`TURNSTILE_SITE_KEY\`, \`TURNSTILE_ALLOWED_HOSTNAMES\` are set for the actual Vercel preview/production hostname. The client and server use the same \`pokebro_sourcing\` challenge action.
- Full end-to-end validation with synthetic requests, legitimate confirmation in Outlook, edge/rate-limit tests, explicit privacy policy updates and rollback plan.

**Warnings:** Microsoft Graph 202 only means accepted for processing, not inbox delivery. The public endpoint should not be enabled just because environment variables exist. Sending from a personal Outlook.com account with app-only client credentials is not equivalent to a Microsoft 365 Exchange Online enterprise mailbox. Verify the tenant/mailbox license and permissions.

## Phase-specific budget

### A — No-cost incremental pilot (now)
- Use click-to-compose Outlook email draft from \`/sourcing.html\`, manually send, manually acknowledge and review.
- Store leads in the existing Outlook mailbox. No automatic website submission, no paid AI, no paid WhatsApp messages.
- **Incremental service subscription target:** €0/month, **excluding existing Outlook/domain/Vercel subscriptions and real labor**.

### B — Secure website-to-Outlook relay
- Turnstile Free + existing Outlook + Microsoft Graph + Vercel Functions.
- Likely low *per-email* variable cash outlay within subscribed/included usage, but must measure server/edge usage and permission administration.
- External edge throttling/rate limiting must be verified; may incur platform charges.
- Optional Power Automate might be available under existing Microsoft 365 use rights; do not purchase Premium without necessity.

### C — AI sourcing assistant and WhatsApp
- AI requests = (input tokens × price) + (output tokens × price) + any tools/search provider fees + image/verification costs.
- WhatsApp = billed outbound service/utility/marketing/authentication messages minus applicable allowances, plus BSP markup if chosen.
- Each published opportunity must include retrieval timestamp and confirmation status. No authorization to buy given to AI by default.

## Merchant unit economics — illustrative sourcing case

Customer sources a €200 graded slab. Suppose Epic Decks proposes **8% service fee = €16**.
- 20 minutes of manual research at **€24/hour internal opportunity-cost assumption**: **€8.00**
- AI/model/comparison allowance assumption: **€0.20**
- If the **€16 sourcing fee only** is charged separately, assume **€0.60** payment/administration costs (illustrative only): **€7.20 contribution** before overhead, VAT, disputes and support.
- If Epic Decks instead collects **€216 from the buyer as the seller**, assume payment handling on the entire amount at an illustrative **1.5% + €0.25 = €3.49**: fee revenue **€16**, less €8 labor, €0.20 AI, €3.49 payment cost = **€4.31 contribution** *before* logistics, VAT, returns, marketplace fees, grading/authentication risk, capital costs, etc. Do not equate this to profit.
- Epic Checkpoint must charge separately for inbound/outbound insured shipping, inspection minutes, risk and materials; €15 extra is not guaranteed to cover it.

**Pricing hypothesis:** Consider a **minimum agent fee €15–€25**, and a tiered percent for more expensive/high-complexity buys. Test willingness to pay before publication; don't assume an 8% fee is profitable for low-ticket items.

### Seller platform economics — commercialization
Hypothesis for future Inventory Studio / Collector Network: seller plans €29–€79+/month plus optional processing credits or success-based commissions. **These are experiments, not validated prices.** Price must cover:
- Per-tenant hosting/database/storage and high-water-mark peak usage;
- AI extraction and marketplace/grader fees per slab or per sourcing attempt, including failed checks;
- WhatsApp messages and delivery notices per customer;
- Payments, refunds, disputes, KYC/verification and fraud;
- Merchant onboarding, support, feature maintenance, privacy/compliance.

Per-customer gross contribution = revenue (subscription + per-use + referral/commission) - direct usage and servicing costs. Maintain separate cost centers for Epic Decks' own card trading and software-platform customers to avoid hiding operational subsidies.

## Measurements for 20-request pilot
Collect request count, qualified enquiries, research minutes, source checks, leads turning into quotes, approved transactions, service fee collected, any returns, realized cost-to-serve, and contribution. Any data collected beyond contact details needs proportionate privacy terms and retention.

**Approval checkpoint:** Stay in draft-preview mode and do not incur new subscriptions, purchase credits, or execute customer payments before the user reviews a real budget.
