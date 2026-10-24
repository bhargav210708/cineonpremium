# Cinéon — cinema discovery and social screening journal

Cinéon is a React 18 + Vite + TypeScript app with live TMDB discovery, a canvas ticket-card studio, and a local-first workspace for diary entries, community posts, tribes, cinema reports, watch parties, lists, stats, profile, settings, notifications and AI-assist UI.

> **Deployment truth:** the TMDB/discovery/card flows and local workspace are usable in the browser. Firebase Google/email-link authentication and server-side Cloud Functions are scaffolded. Most workspace records remain local-first. Public community posts can sync to Firestore when Firebase is configured and the user is signed in; image/video uploads need Firebase Storage and authenticated access. Local-only media attachments are intentionally size-limited. Cinema reports and other workspace data are not all synchronized across users/devices yet. Do not describe this build as a fully production-ready multi-user social network until those adapters, rules tests, push delivery, moderation queue and E2E tests are completed.

## Requirements

- Node.js 20+
- npm
- TMDB API Read Access Token
- Optional: Firebase project with Authentication, Firestore and Storage enabled
- Optional: Anthropic API key stored as a Firebase Functions secret (server-side only)

## Run locally

1. Copy `.env.example` to `.env.local`.
2. Get your token from TMDB API settings: https://www.themoviedb.org/settings/api
3. Add it to `.env.local`:

   ```env
   VITE_TMDB_TOKEN=your_tmdb_api_read_access_token
   ```

4. Install and run:

   ```bash
   npm install
   npm run dev
   ```

5. Open the Vite URL printed in the terminal, usually `http://localhost:5173`.
6. Validate before deployment:

   ```bash
   npm run typecheck
   npm run lint
   npm test
   npm run build
   ```

The current execution environment could not finish dependency installation, so run these validation commands on a machine with npm registry access before deploying.

## Optional Firebase setup

1. Create a Firebase project and add a Web App.
2. In **Authentication → Sign-in method**, enable Google and Email link/passwordless sign-in.
3. Create a Firestore database and Storage bucket.
4. Copy the Firebase web-app values into `.env.local` using the `VITE_FIREBASE_*` keys in `.env.example`.
5. Install Firebase CLI and sign in:

   ```bash
   npm install -g firebase-tools
   firebase login
   firebase use --add
   ```

6. Deploy the Firestore rules, Storage rules, indexes and Cloud Functions after reviewing them against your actual collection schemas:

   ```bash
   cd functions
   npm install
   npm run build
   cd ..
   firebase deploy --only firestore:rules,firestore:indexes,storage,functions
   ```

7. For the AI proxy, set the secret and deploy functions:

   ```bash
   firebase functions:secrets:set ANTHROPIC_API_KEY
   firebase deploy --only functions:aiAssist
   ```

8. Copy the deployed `aiAssist` HTTPS URL into `.env.local` as `VITE_AI_FUNCTION_URL`. Enable AI assistance in the Cinéon Settings page and sign in to Firebase before calling it. Provider keys must never be stored in `VITE_*` variables.

Firebase config values for a web app are not Admin credentials, but authorization must still be enforced by Firebase Security Rules and App Check. `VITE_APP_CHECK_KEY` is documented for configuration; App Check initialization and enforcement still need to be wired before production use.

## Features

### Working browser flows
- TMDB trending, now playing in India, upcoming, top rated, search and movie details.
- Cast/crew, trailer and India watch-provider information where TMDB returns it.
- Local watchlist, ticket-card editing, alternate poster choice, formats/styles, PNG export, Story-size export and Web Share fallback.
- Diary CRUD (soft delete marker), rating/review/spoiler toggle, visibility selector and CSV export.
- Local community feed, likes, comments, follow controls and report/hide action.
- Local tribes with join/leave and tribe posts.
- Cinema report entry and aggregate scores calculated from local reports.
- Watch-party creation, format/time voting and host lock toggle.
- Custom lists from the local watchlist, profile, settings, stats/passport, notification inbox and data export/delete.
- Firebase Google popup and email-link authentication UI when Firebase is configured.
- Authenticated server-side AI proxy with per-user rate limit and server secret.

### Still required for production parity with the master specification
- Firestore repository adapters to replace local workspace writes and provide genuinely shared social data and cross-device sync.
- FCM push notifications, App Check initialization/enforcement, full moderation/admin queue and comprehensive rate limiting.
- Complete account deletion across every collection and Storage object after schema finalization.
- Letterboxd import, calendar heatmap, half-star input, photo upload/resizing/EXIF stripping, collaborative list permissions and real shareable OG pages.
- PWA install/offline/background sync, worker-based card rendering/palette/stats, and full i18n.
- Firebase Emulator security-rule tests, Playwright critical-flow tests, bundle-budget CI and Lighthouse/accessibility audits.

## Project structure

```text
src/
  app/                         routing/providers (routes currently in main.tsx)
  components/                  shared layout and movie cards
  features/
    discover/ movie/           TMDB discovery and detail views
    card-studio/               ticket editor and PNG rendering
    watchlist/                 local saved movies
    workspace/                 diary, social, tribes, cinema reports, parties,
                               lists, stats, profile, settings, notifications, AI
  lib/                         TMDB, Firebase initialization, local workspace storage
  styles/                      design tokens and responsive styles
  types/                       TMDB types
functions/src/index.ts         cinema roll-up, badge trigger, AI proxy, deletion endpoint
firestore.rules                authenticated collection rules
storage.rules                  user-owned image path rules
```

## TMDB attribution

This product uses the TMDB API but is not endorsed or certified by TMDB. Provider availability comes from TMDB/JustWatch and may change. Follow TMDB's current terms for imagery and data usage.


## Cinema Lab additions

Open `/cinema-lab` from the sidebar to use the new Living Cinema workspace:

- **Mood Engine:** browse TMDB movie discovery by a selected mood/genre and save films to your personal Film Museum.
- **Cinema Time Machine:** chronological view of your recorded diary entries.
- **Personal Film Museum:** save movies with personal notes; stored in this browser's local storage.
- **Director Universes:** search TMDB people and explore their credited films.
- **Watchroom planner:** create a screening idea and save it into the existing local watch-party workspace. Preview votes are not shared or persisted.
- **Annual Chronicle:** recap diary entries, cinema count, ratings and tags for a selected year; print to PDF from the browser.
- **Nearby cinema discovery:** use `/cinemas-nearby` for the local cinema directory and manual cinema/screen submissions.

The Cinema Lab uses the existing diary, TMDB client and workspace data structures rather than replacing them. The personal Film Museum and nearby cinema directory are currently browser-local. The watchroom preview is not real-time multiplayer. Automatic venue discovery, shared user-to-user synchronization, live group voting, verified cinema submissions and provider-backed showtimes require a configured backend/places service and are not represented as completed integrations in this build.

### Setup

1. Copy `.env.local.example` to `.env.local`.
2. Put your TMDB API Read Access Token in `VITE_TMDB_TOKEN`.
3. Run `npm install`, then `npm run dev`.
4. Run `npm run build` before deployment.

## Release verification and known limitations

See [`FINAL-VERIFICATION-REPORT.md`](./FINAL-VERIFICATION-REPORT.md) for the honest feature-by-feature source audit, commands attempted, blocked tests, environment requirements, and known limitations. In this delivery environment, npm dependency installation timed out; the production build and browser end-to-end journeys are therefore not certified. Configure `.env.local` from `.env.local.example` before running the app.


## Cinéon additions in this release

- **S Pen Diary** (`/stylus-diary`): the ink canvas accepts pointer events reported as `pen`; touch and mouse drawing are ignored. Page turns use a lightweight paper-flip animation. Pages save locally and can be exported/shared as images. Device/browser stylus reporting varies, so test with the target S Pen device.
- **Nearby cinemas**: location permission searches nearby OpenStreetMap listings; Google Maps links open place/search pages without loading an embedded map. No distance values are shown in the venue cards.
- **Premiere Radar**: city can be filled from location permission. Missions offer Google Maps, BookMyShow and District search shortcuts. Automatic checks only run while the page is open if `VITE_RADAR_MONITOR_URL` points to an authorised endpoint that returns verified availability. Continuous background monitoring needs a deployed scheduler/push service and a permitted ticket-data source; the browser does not scrape booking sites.
- **Community media**: attach images and short videos to posts. With Firebase Auth + Storage + Firestore configured, media can be uploaded and public posts synced; without it, small attachments stay local to this browser. Deploy the updated `storage.rules` before enabling public media uploads.
- **PWA**: use the browser's Install app prompt where available. On iOS, use Share → Add to Home Screen. Serve the production build over HTTPS (localhost is supported for development).
- **Brand**: the app is now named **Cinéon — Your Personal Cinema Universe**. Existing `CINÉON.*` local-storage keys are retained so previously saved data is not discarded.
