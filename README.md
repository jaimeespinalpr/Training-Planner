# Training Planner

A mobile-first training planner for Young Guns Nashville coaches.

**App:** https://jaimeespinalpr.github.io/Training-Planner/

## Features

- Plan wrestling, lifting, and mind and focus sessions. Each track has its own draft and exercise library.
- Add sections and exercises with names, minutes, and coaching notes. Named exercises are saved automatically to the local library for reuse. Editing an exercise updates its library entry; previously saved plans keep their own copies.
- Customize the club or school, coach, season, footer, document color, and club logo (PNG, JPG, or WebP, up to 10 MB). Logos are converted to PNG at a maximum dimension of 640 pixels and saved on this device.
- Save a plan locally, then download or share a PDF. The PDF groups activities by section, shows subtotals and planned duration, and continues long tables across pages. Empty sections are omitted. File sharing uses the device's native share menu when supported; otherwise the PDF downloads for manual attachment.

## Local data and older plans

Plans, branding, and the exercise library are stored in browser localStorage, not Firebase. Clearing browser data deletes them, so keep a PDF copy of important plans. Cross-device syncing and authenticated assignments are not enabled. Firebase files in this repository are for a possible future integration and are not deployed.

The library uses `tp_exercise_library_v1`. Plans are stored in `tp_draft`, `tp_tracks`, and `tp_templates`, with rows shaped as `[name, minutes, details, category, libraryId]`, plus `categories` and `schemaVersion: 2`. Older plans are normalized when opened, retaining their exercise names, durations, and notes. Built-in Spanish category names from older versions are displayed in English. User-entered names and notes remain as entered.

## Development and validation

Serve the project root with `python3 -m http.server 4173 --bind 127.0.0.1`. Install dependencies with `npm ci --ignore-scripts`, then run `npm test`. Tests cover the interface, persistence, PDF export, and the Web Share contract in headless Chrome. Native iOS and Android share menus still require verification on a physical device. The current test script uses `/usr/bin/google-chrome`.

## Publishing

GitHub Actions publishes application files and `vendor/`, excluding development dependencies and Firebase files. jsPDF and AutoTable versions are locked in `package-lock.json`; browser bundles and licenses are in `vendor/`. Regenerate those bundles and run the tests when dependencies change. The bundled DejaVu Sans font supports accented characters and includes its license.
