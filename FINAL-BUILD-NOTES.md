# Cinéon — Quiet Cinema build notes

## Design intent
The interface favours a calm, cinematic presentation: motion is brief, interactions respond only when useful, and the reduced-motion preference is respected. The first-frame intro is skippable and remembered after dismissal. Keyboard focus indicators and restrained page entrance effects are included.

## Included project features
This archive preserves the supplied app's routes and implementations for discovery, movie details, watchlist, diary, ticket/card studio, Cinema Lab, nearby cinemas, community, profile, parties, stats, settings, notifications, and account workflows. The ticket studio renders a standalone PNG through canvas, with a typographic/artwork fallback when the poster CDN cannot be loaded. The nearby-cinema search uses browser geolocation or city lookup, supports a configurable radius, and now retries multiple public OpenStreetMap Overpass instances if one is unavailable. Duplicate map elements are de-duplicated before display.

## Verification status — read before deployment
A production build and automated tests have **not** been verified in this environment. Dependency installation timed out, and the local TypeScript compiler was unavailable. This ZIP should therefore be treated as an updated source project, not as a claim that every aspirational feature has been completed or production-tested.

The larger wishlist still requires additional implementation and validation: a true Cinema Galaxy constellation view; a pressure-sensitive stylus diary and book-style page-turn experience; complete poster-to-detail shared-element transitions; a genuinely encoded QR (the current ticket pattern is decorative); cross-browser ticket-export testing; and end-to-end tests for Firebase-backed syncing, location permissions, and real external data. AI, push delivery, and account sync require the relevant backend and provider configuration. OpenStreetMap results depend on local map coverage and service availability, so no app can guarantee every nearby theatre is listed.

## Run locally
1. Extract the ZIP.
2. Open a terminal in the `cinetribe` folder.
3. Copy `.env.local.example` to `.env.local` and add your own TMDB/Firebase values as needed. Do not share private keys.
4. Run `npm install`.
5. Run `npm run dev` and open the local address Vite prints.
6. Before deployment, run `npm run build`, `npm test`, and `npm run lint` and resolve any reported issues.

Browser geolocation generally requires localhost or HTTPS and user permission.
