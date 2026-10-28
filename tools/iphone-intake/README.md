# Epic Decks iPhone Slab Intake — local-only pilot

Open `tools/iphone-intake/index.html` from an HTTPS preview on your iPhone, or through a local web server during development.

## Features
- iPhone Camera / Photo Library file picker
- Front and back photo preview and client-side JPEG resizing
- Editable slab metadata including grading company, certificate, SKU, purchase cost and selling price
- Browser IndexedDB draft saving and JSON exports
- Optional protected AI analysis for each slab pair (card/label suggestions and visual mismatch warnings). **No certificate verification, automatic publication, or account system.**

## Security
- This prototype does not transmit private draft content to the host. It stores photos and purchase costs **on each device's browser**. Clearing Safari website data or using private browsing can delete drafts. Export frequently.
- The prototype page is **not access-controlled**. Anyone with the deployment URL can load its blank form, but drafts cannot be read remotely from this code.
- Do not add server writes or an AI API key in client-side code. Future cloud data storage must use authenticated requests with authorization.
- This repo is currently public: never commit photos, purchase prices, or internal JSON drafts. Existing committed workbook content may remain in Git history despite deletion on the branch.
- Do not merge the accompanying inventory workbook deletion unless you have a secure backup.

## Deploy preview (Vercel)
1. In Vercel, confirm `epic-decks-live` is linked to GitHub.
2. In the project Settings -> Git, verify connection to `ayanpande-live/epic-decks-live`.
3. Check Deployments for the preview build of `feature/slab-intake-pilot-20261023` (do **not** deploy main).
4. Open that preview's `/tools/iphone-intake/` or `/tools/iphone-intake/index.html` URL on your iPhone Safari.
5. Share -> Add to Home Screen.
6. Test front/back photos, save a dummy draft, export JSON. Do not treat this as inventory master.

If no Vercel project is linked, import the existing repository as a Vercel project and configure it as a **static site without a build command**. Do not put the site live via main to test this feature. Protected preview access may require Vercel authentication on the iPhone.

## Next
Test with five distinct slabs, including one intentionally reversed/mismatched photo pair; then add private authenticated storage, rate-limited AI access, per-tenant usage tracking and authorized grading-company lookups. 

## AI extraction setup (preview-only)
The photo gallery works without any AI setup. To enable the optional **Analyze current photos** feature:
1. In Vercel open Epic Decks Live → Settings → Environment Variables.
2. Add `OPENAI_API_KEY` = your OpenAI API key (server-side, sensitive), scoped to **Preview** only. Never enter or commit it in GitHub or the web page.
3. Add `INTAKE_ACCESS_TOKEN` = a separate long randomly generated access code, also Preview only. Type this value into the iPhone app when you deliberately choose to analyze a pair.
4. Optional `OPENAI_MODEL` = `gpt-4.1-mini`.
5. Redeploy the **preview** after adding variables, then use its latest URL. Keep deployment protection enabled.

The endpoint `/api/slab-analyze` has an access code gate, only handles 1–2 images per request, and calls the OpenAI Responses API server-side. It does **not** verify grading certificates, prices, or authenticity and must not be treated as a production public intake backend. This is a limited pilot; before larger usage implement actual account authentication, quotas/rate limits, audit logging and private cloud draft storage.

## Standardized batch intake workflow (development preview)

1. Choose **Batch import** first. Select photos in alternating order: **front 1, back 1, front 2, back 2**. This minimizes manual per-photo uploads. iPhone photo pickers may change the selected order: **never assume it is correct**.
2. Review the overview showing all proposed slab pairs. Select any pair to see its photos. Use the **Front picture / Back picture** dropdowns or tap gallery thumbnails to correct assignments. Using an image in more than one pair will be flagged and blocks loading that pair.
3. (Optional but strongly recommended in testing) Enter the existing **Private AI access code** and choose **Review photo pairs with AI**. This deliberately sends each proposed pair to the AI provider **one request at a time**. Up to 30 photos / 15 slab pairs are supported in one batch. A Stop button interrupts the sequence after the current request.
4. The AI tries to flag reversed photo order, mismatched cards, unrelated images or insufficient visual evidence. The rear of a slab may not reveal an identity, so the AI may be unable to confirm a pair. **AI warnings are not a certificate verification, and absence of a warning is not proof of a match.**
5. Inspect the images yourself, correct any pairing errors, and **re-run AI** for modified pairs if needed (the batch button presently rechecks all pairs, including previously checked ones). For a flagged pair or missing back, explicit operator confirmation is required before loading. If current pair analysis later flags an issue, confirmation is required before saving.
6. Tap **Use this pair**, check the front/back images shown beside the draft fields, review or manually enter the card and slab-label details, then **Save private draft**.
7. Continue to the next pair. You can revisit an already saved pair and save changes to the same draft ID, rather than creating a second draft. When finished, choose **Export all JSON** as your private backup.
8. For just one slab, use **Taking photos of one slab? Open individual upload**. Its existing front/back workflow remains available.

**Cost & privacy:** The preview makes no background AI calls on photo selection. Each submitted pair costs one external AI vision analysis, and re-running the batch incurs additional usage; actual costs vary by chosen model, image size and tokens. The AI button requires an existing protected server access token and server-side OpenAI API key. Never place either secret in GitHub or copy them into public instructions. The photo previews and staged drafts remain in the device browser until the user explicitly requests AI analysis. No direct stock update or publishing occurs.

**Restrictions:** This is an internal pilot with only an access-code gate for AI and no persistent rate limiting, proper authentication or durable audit trail. Do not expose it as a production shared merchant upload service; keep previews protected. Mobile and real-world AI matching accuracy still require testing.

IMPORTANT: do not merge the branch until the public inventory workbook is securely backed up and prior Git history exposure is addressed.
