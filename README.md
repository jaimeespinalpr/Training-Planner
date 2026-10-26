# Training Planner

A mobile-first training planner for Young Guns Nashville coaches.

**App:** https://jaimeespinalpr.github.io/Training-Planner/

## Features

- Plan wrestling, lifting, and mind and focus sessions. Each track has its own draft and exercise library.
- Add sections and exercises with names, minutes, and coaching notes. Named exercises are saved automatically to the local library for reuse. Editing an exercise updates its library entry; previously saved plans keep their own copies.
- Customize the club or school, coach, season, footer, document color, and club logo (PNG, JPG, or WebP, up to 10 MB). Logos are converted to PNG at a maximum dimension of 640 pixels and saved on this device.
- Save a plan locally, then download or share a PDF. The PDF groups activities by section, shows subtotals and planned duration, and continues long tables across pages. Empty sections are omitted. File sharing uses the device's native share menu when supported; otherwise the PDF downloads for manual attachment.
- On phones, use the collapsible warm-up controls, section jump chips, sticky action bar, and all-category exercise search to move through a plan quickly. Draft status shows when it was last saved on this device; incomplete activities are flagged before PDF creation.
- Duplicate any saved plan to reuse a previous practice, then rename/date and save the copy as a new plan.
- Use **Backup / restore** to download a JSON backup or restore one on another device. Restore replaces the planner data stored in that browser.

## Local data and older plans

Plans, branding, and exercise libraries still save to browser localStorage immediately. **Account & sync** adds Google sign-in and private Firestore sync in the existing `wrestling-app-dev` project. On the first device, sign in and choose **Start sync with this device**. On another device, sign in to the same account and choose **Load cloud copy**. Nothing uploads merely because you sign in.

After linking, edits upload after five seconds of inactivity while online. A cloud check runs every 30 seconds while the page is visible. Newer remote copies require **Load cloud copy**; simultaneous edits pause for an explicit choice. Transactions check the previous cloud revision before changing the current version, so a stale device cannot silently overwrite a newer version. Offline edits remain in localStorage and are retried when online. A second tab pauses syncing until reloaded.

Every upload creates an immutable cloud version, with a SHA-256 integrity check and chunked base64 JSON to preserve nested rows, library IDs, and embedded images. The app supports snapshots up to 20 MB. Before uploads and restores, it also saves a recovery snapshot in IndexedDB. **Cloud history** lists the latest 20 versions for download; older versions remain in Firestore. **Recovery backups** downloads device snapshots. Restore downloaded files using **Backup / restore**. Existing cloud versions and recovery snapshots are not automatically deleted, so storage usage grows with edits. Browser clearing removes local recovery copies; keep a downloaded backup too.

Signing out keeps device data and removes the automatic-sync link. A different account must explicitly choose what to upload. Use a trusted device. Cloud data is scoped to `trainingPlanner/{Firebase UID}`; authenticated users cannot read other accounts' planner data. No service-account keys or private backups are published.

The library uses `tp_exercise_library_v1`. Plans are stored in `tp_draft`, `tp_tracks`, and `tp_templates`, with rows shaped as `[name, minutes, details, category, libraryId]`, plus `categories` and `schemaVersion: 2`. Older plans are normalized when opened, retaining their exercise names, durations, and notes. Built-in Spanish category names from older versions are displayed in English. User-entered names and notes remain as entered.

## Development and validation

Serve the project root with `python3 -m http.server 4173 --bind 127.0.0.1`. Install dependencies with `npm ci --ignore-scripts`, then run `npm test`. Tests cover the interface, persistence, PDF export, and the Web Share contract in headless Chrome. Native iOS and Android share menus still require verification on a physical device. Tests use Playwright Chromium by default; set `CHROME_PATH` to an installed Chrome executable. Run `node tests/sync-core.mjs` for snapshot and rollback tests. With Java 21 installed, run the Firebase Auth and Firestore emulators, then `TP_BACKUP=/path/to/backup.json node tests/sync-browser.cjs` (including cross-account rule checks). The browser integration suite uses emulator-only test accounts; never point it at production.

## Publishing

GitHub Actions publishes application files and `vendor/`, excluding development dependencies, private data, and server configuration. The public Firebase web configuration and bundled browser SDK are included. Run `npm run build:firebase` after changing Firebase dependencies. jsPDF and AutoTable versions are locked in `package-lock.json`; browser bundles and licenses are in `vendor/`. Regenerate those bundles and run the tests when dependencies change. The bundled DejaVu Sans font supports accented characters and includes its license.

## Firebase operations and rollback

Use `npx -y firebase-tools@latest deploy --only firestore:rules --project wrestling-app-dev` to deploy rules. This repository preserves the project's prior rules for other applications and adds only `trainingPlanner/{uid}`. The pre-change rules are saved separately in the setup deliverables. Do not deploy the old placeholder rules from older repository commits.

Google sign-in was enabled with `deploy --only auth`; the authorized production domain is `jaimeespinalpr.github.io`. Auth domain allowlisting is a backend setting; adding domains to an arbitrary local JSON field does not apply them. Use the Firebase console or the CLI's supported auth-domain API to update that list while preserving existing entries.

No bulk migration writes to existing collections. Initial migration happens in the signed-in browser after an explicit upload selection. To roll back the app, revert the integration commit and republish GitHub Pages: all original localStorage keys and the JSON backup format remain compatible. Download a cloud version before returning to a browser that lacks current local data. Do not delete cloud snapshots as part of rollback.

The additional security rules validate snapshot envelopes, chunk bounds, timestamps, monotonic head revisions, and account ownership. Snapshot JSON is opaque to rules and validated by the app; never use fields inside it to grant access. The preserved legacy rules are outside this integration's audit scope.
