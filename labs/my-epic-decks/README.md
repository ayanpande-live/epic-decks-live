# My Epic Decks — working freemium mobile prototype
**Private-review concept; not a production app, connected account, paid subscription or live collection sync.** Code is in a draft PR and serves as a standalone static app under \`/labs/my-epic-decks/index.html\`.

## Experience iteration (16 Nov 2026)
- **Today’s Quest** on the dashboard starts a three-fact practice loop immediately, loading fictional demos if no cards exist, and unlocking a single card if free quota permits. The CTA reduces the original multi-step friction of finding a card and navigating into Learn.
- Multiple-choice recall is offered only where two other distinct answers exist in the *same source class* (synthetic demo vs user-provided). Otherwise the app uses reveal/self-reported recall. This is a basic UI practice game, **not a validated assessment of card knowledge**.
- Feedback visually distinguishes correct/incorrect choices, progress through the three-fact quest, and saved XP. Correctness and facts remain source-limited and are not independently verified.
- Existing browser storage key and freemium rules remain unchanged. No real user inventory, subscriptions or third-party sync added.

## What works now
- Mobile-first app with Epic Decks branding, dashboard, collector library, learning challenges, XP/levels, basic adult Seller Studio, and a simulated upgrade page.
- **10 newly unlocked unique cards per calendar month** in the free experiment. A previously unlocked card can be practised repeatedly without burning another slot. Imported-but-locked cards remain accessible in the library. Demo has 12 explicitly *fictional* cards so the 11th unlock can be tested.
- Manual card input; optional photo preview in memory **without image recognition or persistent image storage**.
- User-provided CSV/TSV, manual mapping of header columns, duplicate detection by grader+certificate (unique slab) or card printing (raw/uncertified), rejection of missing names, local collection cap of 300 records and CSV limit of 500 rows / 1 MB. Import support for actual Dex/Collectr file schemas is **not yet guaranteed or tested**; no live OAuth/API connection.
- Card learning uses only available source fields: name, series, illustrator, feature, pose, grade/condition. Unknown facts are **not** generated. "I remembered" / "Need another look" award XP, with unlimited basic practice.
- Seller Studio allows an adult/supervised test participant to write a pitch and get transparent **rule-based coverage checks**; it is not a speech/AI coach and does not verify condition or market prices.
- "Pro preview" temporarily removes the demo unlock limit through a local setting. **€7.99 is a hypothetical monthly fee**, with no billing or real entitlements.
- Browser-local persistence (localStorage), user-triggered private JSON export, clear/reset. No telemetry, analytics, cookies beyond app localStorage, collection uploads to servers or external AI calls.
- Installable prototype manifest and offline app-shell cache. Install appearance/support depends on browser/PWA implementation; saved collection stays within the browser profile, not synced across devices.

## To test on iPhone
1. Open the Vercel **draft branch preview** at \`/labs/my-epic-decks/index.html\` using Safari (this is not the public site).
2. First tap **Start quick quest** from the dashboard and finish three questions. Then tap **Try 12 demo cards**. The library should show 12 *fictional* records.
3. Unlock 10. The dashboard should show **10 / 10**, and the 11th free card should send you to the mock upgrade page.
4. Go to **Learn**, choose an unlocked card, reveal a fact, and mark "I remembered." XP and level stats should update; you should still be able to repeat this lesson after reaching the free limit.
5. Try **Seller Studio**: it requires the adult/supervised acknowledgement and a typed pitch. Confirm feedback is presented as a rule-based checklist, not magic AI analysis.
6. In the demo upgrade page, enable/disable **Pro preview**; confirm the 11th card can be unlocked without a payment.
7. Reload Safari; records and progress should remain for this browser profile. Try Share > Add to Home Screen; verify the installed icon and navigation (may vary on iOS).
8. If the screen clips, becomes unresponsive, fails to save, or renders badly, capture an iPhone screenshot and browser/iOS version.

## To test on desktop
1. Open the same preview link in a normal browser.
2. Use **Add a card** to enter a *fictional* name, known set, optional illustrator, artwork feature and pose. Verify it appears in the collection.
3. Test CSV import with **synthetic, non-business data**. Example:

\`\`\`csv
Card Name,Set,Card Number,Illustrator,Visual Feature,Pose,Language,Variant
Cloud Explorer,Example Studio,001/003,Fictional Artist A,Turquoise holographic border,Leaning forward,English,Demo foil
Ember Sprite,Example Studio,002/003,Fictional Artist B,Yellow sunburst background,Flying upward,English,Demo foil
\`\`\`

4. Check that the importer maps columns sensibly, allows overriding mappings and shows duplicate/invalid reports. Import the file twice; the second time should create no new records.
5. Open a learning card with an absent illustrator. The lesson must **not** invent an artist.
6. Check Export JSON and Clear data only using synthetic demo data; note local data is not a backup unless separately exported.
7. Test narrow browser viewport (360 px), browser keyboard focus, and reduced-motion OS settings.

## MVP engineering gates (not built yet)
1. **Rights and facts:** official/art image licensing and permission, reliable card metadata provenance, fact confidence levels, correction workflow and audit of inferences. Claims must be verified before commercial seller scripts use them.
2. **Identity and storage:** secure authentication, private database/object storage, cross-device sync, export/delete, minimal retention, server-side 10-cards/month quota, idempotency and anti-abuse. Browser localStorage is **not** an account quota or durable storage system.
3. **Import adapters:** obtain allowed Dex+ / Collectr sample exports from consenting users, confirm actual schemas and provider rights before claiming official import support. Support exact printing, language, variant, graded certs, quantities and duplicates. No private Epic Decks inventory in the public repo.
4. **Teaching engine:** source-backed card facts plus clearly marked subjective art descriptions, curated quizzes, spaced repetition, and transparent factual scoring. Optional user-requested AI/voice coaching only after accuracy/cost tests and consent.
5. **Subscriptions:** product onboarding and free plan; payment processor/app-store/VAT/refund checks; €7.99 vs alternatives tested against measured conversion and costs. Unlimited **standard** card unlocks can be the Pro offer; AI voice and expensive processing need disclosed usage limits.
6. **Children:** start with adult testers; child-safe experience and parental authorization/privacy review required before marketing for children. No manipulative sales coaching or behavioral advertising to minors.
7. **Costs:** profile photo bytes/card, API and AI spend per 100 cards, caching hit rate, support/storage/egress, gross margin and free-tier abuse resistance before a paid launch.
8. **Release:** real-device QA, accessibility, performance, security audit of existing public repo (#38), independent site/repo hosting decision and founder approval. This design has no public payment or online customer functionality.

## Run automated domain tests locally
Requires Node.js 20+:
\`\`\`bash
cd labs/my-epic-decks
node --check core.mjs
node --check app.mjs
node core.test.mjs
\`\`\`
No dependencies or npm installation required.

## Scope/ownership
This prototype intentionally reuses the *public*, existing Epic Decks static website deployment pipeline to get a **draft Vercel preview** without new hosting spend. There is no private account backend. Its code is visible in a public repository, so it must never contain supplier costs, personal card portfolios, secrets, customer uploads, legal documents or real inventory. Founder VCT issue #40 captures strategy; VCT issue #38 is a separate public-repo safety issue. Neither the static demo nor the old public repo should become the production data store.
