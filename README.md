# Training Planner

Mobile-first training-plan workspace extracted from Wrestling Performance Lab and redesigned with a fresh visual system.

## Current version

This first version is a working static planner with three tracks:

- Wrestling practice
- Lifting & conditioning
- Mind & focus

It supports editable activities, time totals, progress, local drafts, saved-template UI, sharing, and responsive mobile layouts.

## Firebase connection

`firebase-config.example.js` documents the public web configuration required for a connected deployment. Firebase web configuration is not a service secret. Keep service keys and API secrets out of the repository.

The included `firestore.rules` is a starting contract for `training_plans`, `training_templates`, and user documents. Before production, add Firebase Authentication and server-validated custom claims for coach roles. Do not rely on localStorage for authorization.

## Run locally

```bash
python3 -m http.server 4173
```

Open `http://127.0.0.1:4173/`.

## Deployment

This repository is designed for GitHub Pages. The workflow in `.github/workflows/pages.yml` deploys `main` automatically.

## Roadmap

1. Connect Firebase Auth and Firestore.
2. Add coach/athlete assignment flow.
3. Add cloud templates and realtime updates.
4. Add calendar integration and notifications.
5. Add tests for role permissions and mobile UI.
