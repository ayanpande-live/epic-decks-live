# iPhone Slab Intake — mobile-first pilot

A full standalone mobile web app was produced and tested as a downloadable ZIP in the related ChatGPT conversation: **epic_decks_iphone_intake_pilot.zip**.

The downloadable implementation supports:
- iPhone photo library / camera picker for front and back
- On-device photo resizing and previews
- Manual grading details review (13 fields)
- IndexedDB draft storage on the iPhone, and JSON export
- Explicitly **no server upload or automatic publishing**

It is **not yet deployed to a private HTTPS address**, and the app source is **not yet committed to this GitHub repository**. Do not merge or claim the GitHub branch includes the web app.

## Safety and design
Use verified authentication and private object storage before adding server-side AI recognition, ACE verification, or catalog publishing. Keep supplier and purchase prices private. The mobile pilot is not an inventory source of truth: local browser data can disappear. Export JSON regularly.

## Follow-up delivery
Commit the downloadable source files, provision a protected HTTPS preview, test on Safari with 5 real slabs, then implement the review → approve → publish queue. Do not expose a public server intake endpoint without authentication.
