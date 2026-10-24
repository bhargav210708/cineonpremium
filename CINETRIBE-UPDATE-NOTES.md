# Cinéon update notes

## What changed
- Added a more varied visual system: mood-specific colour atmospheres, restrained motion, ticket depth/hover response, and reduced-motion support. The design direction combines Van Lent's motion-led editorial presentation with Chicago.com's colourful community-oriented navigation and interaction ideas; it does not copy their assets or layouts.
- Removed Lists from the dashboard/sidebar and removed its route.
- Expanded CinemaLab Mood Engine with original language, Indian age certification, release year, runtime, discovery style and sort controls. These are passed to TMDB's Discover endpoint.
- Fixed the invalid poster URL regular expression in the ticket export path. PNG export now fetches the poster as a CORS-enabled blob, decodes it before drawing, and uses a local object URL so the poster is actually painted into the export canvas.
- Added account-scoped Firestore workspace sync for workspace data and watchlist, plus a public-profile directory and profile visibility controls. Friend search finds public profiles by handle, display name or city.

## Setup
1. Install Node.js 20 or newer.
2. Copy `.env.local.example` to `.env.local`. Add your TMDB API Read Access Token as `VITE_TMDB_TOKEN`.
3. For cross-device sync and friend search, create your own Firebase project, enable Authentication (Google and Email link), create Firestore, and fill in the `VITE_FIREBASE_*` variables in `.env.local`.
4. Deploy the included Firestore rules: `firebase deploy --only firestore:rules` (after selecting your Firebase project with the Firebase CLI).
5. Run `npm install`, then `npm run dev`. Create a production build with `npm run build`.

## Important notes
- Firebase credentials are intentionally not included. Authentication, cloud sync and cross-user search cannot work until you configure a Firebase project and deploy the rules.
- Public profile search returns only profiles whose visibility is `public`; `private` profiles are excluded. The `followers` choice is stored as a privacy setting, but a full follower-only profile/entry permission system still requires follow relationships and corresponding rules.
- PNG export requires a network connection for a poster that is not already available to the browser cache. If the poster CDN is offline or blocked, the app now gives a clear export error instead of silently exporting a posterless ticket.
- I could not run a complete production build in this environment because npm dependencies could not be downloaded; please run `npm install` and `npm run build` locally after setting up your environment.
