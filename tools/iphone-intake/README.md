# Epic Decks iPhone Slab Intake — local-only pilot

Open `tools/iphone-intake/index.html` from an HTTPS preview on your iPhone, or through a local web server during development.

## Features
- iPhone Camera / Photo Library file picker
- Front and back photo preview and client-side JPEG resizing
- Editable slab metadata including grading company, certificate, SKU, purchase cost and selling price
- Browser IndexedDB draft saving and JSON exports
- No AI, certificate verification, cloud upload, account system, or website publishing yet

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
Test with five slabs; only then build private authenticated storage and server-side AI/ACE verification. 
