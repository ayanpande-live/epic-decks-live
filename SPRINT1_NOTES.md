# Sprint 1 — Inventory safety and slab intake pilot

This development branch removes two locally sensitive project files from the current public repository tree and adds exclusion rules:
- `data/epic_decks_inventory.xlsx`
- `.claude/settings.local.json`
- new `.gitignore` and `.vercelignore`

**Do not merge without checking that a secure copy of the workbook exists.** Deleting the file from the branch does NOT remove it from Git history. Consider moving this entire repository private, or a carefully planned Git-history cleanup after backups and coordination.

A separate local Python slab intake prototype was delivered through ChatGPT as `epic_decks_slab_intake_pilot.zip`. It was tested in manual mode, but **has NOT been added to this GitHub branch**. That prototype uses standard-library Python to run a local web form for front/back images, optionally calls the OpenAI Responses API with an API key to extract label metadata, and saves approved internal drafts under `private-data/`. It does not publish website listings. Do not deploy its local HTTP server on a public endpoint.

Next steps: test with five real slabs; measure extraction accuracy; decide private inventory architecture; build reviewed publishing; then integrate sales channels when supported.

Business scope: graded slabs first; selected singles and sealed later; Double Legends Packs on hold. No website or payment routes changed.
