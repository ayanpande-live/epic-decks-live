# Epic Decks — AWS SES handover and staging checklist
**Decision:** October 27, 2026. SES for application-generated outgoing email, Exchange Online / Outlook for inbound correspondence. Domain registrar GoDaddy; confirm the **actual authoritative DNS host** before editing records. Hosting target AWS Lightsail, with a separate private backend where appropriate. **No production AWS or DNS changes made by this document.**

## What has been verified
- GoDaddy-owned domain `epic-decks.com`; `epicdecks.nl` also owned.
- Microsoft 365 Exchange Admin Center reachable through GoDaddy.
- `welcome@epic-decks.com` sends and receives messages. We can keep it as customer-service inbox.
- Existing Lightsail instance `pitch-lab-dev`: 2 GB RAM, 2 vCPUs, 60 GB SSD, Ubuntu, Paris Zone A. It is **Pitch Lab**, not an Epic Decks production host.
- Public `epic-decks-live` GitHub repository contains inventory workbook, including public product and stock attributes; `purchase_price` reported blank for slabs. Validate non-slab rows, file metadata, and prior history before assuming the workbook is harmless.
- Four draft PRs (#1–#4) remain separate and **unmerged**. No new deployment approved.

## Target architecture
Browser `/sourcing.html` → `/api/sourcing-request` on an AWS HTTPS endpoint → server-side validation + Turnstile challenge + rate limiting → Amazon SES outbound send → `welcome@epic-decks.com` Outlook inbox. Optional customer acknowledgement after SES sandbox exit / deliverability checks. Existing Outlook handles incoming and replies; never move the domain's MX records to SES for this setup.

- Use **eu-west-3 (Paris)** for SES initially; SES is available in this AWS region.
- Prefer Lambda with an **IAM execution role** restricted to the specific SES sending identity, not long-lived IAM keys on the website or in GitHub. A separate Lightsail instance may host the frontend; API Gateway or an equivalent protected AWS HTTPS gateway can route to Lambda.
- Website previews may continue at Vercel until the AWS migration; the Vercel email endpoint is intentionally disabled. No real customer-data intake on unprotected previews.
- Domain signing: verify `epic-decks.com` in SES using **Easy DKIM** and add the exact three CNAMEs AWS generates to the authoritative DNS host. These normally coexist with Microsoft 365's existing DKIM selectors; do not delete existing Microsoft entries.
- Review SPF and DMARC alignment after verification. Do **not** add a second apex SPF TXT record; a custom MAIL FROM subdomain is optional and requires its own DNS records. Do not replace MX, Autodiscover, existing SPF or existing Microsoft 365 DKIM records without an explicit plan.
- SES sandbox: send to **verified recipients only**. Request SES production access before acknowledging requests to arbitrary customer email addresses.
- Keep sales/customer PII and API secrets out of the public GitHub repository and static HTML.

## Checklist: actions required from account owner

### A. SES account and region
1. Open https://console.aws.amazon.com/ses/.
2. Confirm the AWS account and choose **Europe (Paris) eu-west-3** at the top-right region selector.
3. Open **Account dashboard**. Record whether SES is in the **sandbox** and which pricing plan is shown. Do not change the plan yet.
4. Check **Verified identities** for an existing `epic-decks.com` identity.
5. Report the status and screenshots with account IDs, credentials, and any private addresses hidden.

### B. Domain verification (add-only; **not yet** a request to change DNS)
1. SES → **Verified identities → Create identity → Domain**; enter `epic-decks.com`.
2. Select Easy DKIM, normally 2048-bit; record the three **CNAME** names/values generated.
3. GoDaddy → domain → **DNS / Nameservers**. Confirm which provider actually hosts DNS. If GoDaddy, open its DNS management view; if not, use the authoritative provider.
4. Before adding records, capture the existing MX, SPF TXT, DMARC TXT, and DKIM records. Share **redacted screenshots or the three new CNAME values** for validation; CNAMEs are public DNS data, not account secrets.
5. When records are reviewed, add only those three new SES CNAMEs. Wait until SES shows **Verified / DKIM Successful**.
6. Test Outlook send/receive again after any DNS change. Avoid touching any other email or website record.

### C. Production email setup — only after the domain is verified
1. SES → **Account dashboard → Request production access**; describe `transactional sourcing enquiry notifications and customer confirmations for users who submit an explicit website form`.
2. Confirm bounce/complaint process and monitoring; enable production only after AWS approves.
3. Configure a dedicated Lambda execution role with least-privilege `ses:SendEmail` access to the permitted identity; never provide AWS long-lived access keys to a browser.
4. Implement Turnstile **server-side** verification, an allowed hostname list, origin checks, request validation, and independent API rate limits; choose a mechanism with documented costs.
5. Review legal/privacy disclosures and request retention policy; ensure website consent does not silently opt customers into marketing.
6. Test one fake request to the owned Outlook inbox, then a test acknowledgment to an owned verified customer email; confirm actual delivery, From, Reply-To, SPF/DKIM/DMARC, spam-folder outcomes, and an error-path test.
7. Only after verification: enable public sourcing submission and monitor limits/errors/abuse.

### D. Hosting migration order
1. Review current AWS bill for `pitch-lab-dev` and other resources. **Do not restart or repurpose Pitch Lab.**
2. Stage a standalone public Epic Decks website on separate AWS resources. Review app size and privacy boundaries first. Consider Lightail instance + static reverse proxy for website and Lambda for private email, versus a single dedicated server for everything.
3. Move the Vercel-specific `/api` semantics to AWS endpoint routing (reverse proxy / gateway). Preserve same-origin API paths from the frontend.
4. Test HTTPS, routes, mobile/desktop, content, emails and monitoring on the staging hostname.
5. Back up DNS, set rollback plan, then migrate `epic-decks.com`; redirect `epicdecks.nl` only after approval.

## Cost checkpoint — October 2026
- SES launched pricing plans in July 2026. **Essentials** costs **$0.16/1,000 emails** for first 10 million/month; **à la carte** is **$0.10/1,000 outbound emails**. New accounts/regions may default to Essentials. Either costs just cents at pilot volumes, excluding AWS gateway/Lambda/WAF/logging, hosting and personnel.
- Example **100 sourcing enquiries per month × 2 outgoing emails** (internal and customer acknowledgement) = **200 messages** → approximately **$0.032 Essentials** or **$0.020 à la carte** in SES sending fees. This excludes taxes, extras, other AWS infrastructure, and payment/AI fees.
- Do not buy dedicated SES IPs, email deliverability add-ons or paid automation tools for the pilot without explicit approval.
- **Cost monitoring:** set billing alerts, track request count, emails sent, bounce/complaint rate, lambda invocations, gateway/WAF cost, and operator minutes per enquiry.
- Avoid treating incremental SES message cost as the whole system's unit economics. Buying-agent pricing must include labor, customer acquisition, disputes, order management and fees.
- Official sources: https://aws.amazon.com/ses/pricing/ ; https://docs.aws.amazon.com/ses/latest/dg/creating-identities.html ; https://docs.aws.amazon.com/ses/latest/dg/request-production-access.html ; https://docs.aws.amazon.com/general/latest/gr/ses.html ; https://repost.aws/knowledge-center/lambda-send-email-ses

## Current release gate
All email sending integrations remain **disabled**. GoDaddy DNS and Exchange Online are unchanged. The draft Microsoft Graph relay is superseded for planned implementation; it must not be accidentally activated. No provider credentials, secret values or private messages should be committed to the repo.
