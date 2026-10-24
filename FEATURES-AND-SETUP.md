# Cinéon feature guide

## Existing feature routes

- `/` — TMDB discovery
- `/movie/:id` — movie details
- `/studio/:id` — ticket/card studio
- `/watchlist` — watchlist
- `/diary` — screening diary
- `/stats` — stats and Cinema Passport badges
- `/cinemas` — community screen/cinema reports
- `/cinemas-nearby` — browser-local cinema directory, optional geolocation, radius filtering, adding cinemas and screens
- `/experience` — Cinema DNA summary, quest milestones and Year-in-Cinema recap based on diary data
- `/community` — local community feed
- `/tribes` — local groups
- `/parties` — watch-party planning
- `/lists` — lists
- `/profile`, `/account`, `/notifications`, `/settings`, `/ai` — profile and supporting workflows

## Run locally

1. Install a supported Node.js LTS release.
2. Copy `.env.example` to `.env.local` and add your TMDB API Read Access Token or API key in the variable documented in that file. Never commit `.env.local`.
3. Run `npm install`.
4. Run `npm run dev` and open the local URL printed by Vite.
5. Run `npm run build` before deploying.

## Important data and integration boundaries

- Nearby Cinemas saves the directory in this browser's localStorage. It does not automatically query a real-world places provider and entries are community-submitted/unverified. Shared submissions require a configured backend and server-side validation.
- The Diary, community, tribes, reports, watch parties, lists, passport stats and Cinema DNA currently use the local workspace storage. Do not assume they synchronize between devices/users unless Firebase is configured and the corresponding read/write workflows are implemented and tested.
- AI assist requires the documented server-side function and secret configuration. Do not place model-provider secrets in a `VITE_` variable.
- Firebase security rules, authentication providers, indexes and Cloud Functions must be configured and deployed before public multi-user launch. Review `firestore.rules`, `storage.rules`, `firebase.json`, and `functions/` before deployment.
- The Cinema DNA summary reports patterns in user-entered diary data; it does not claim to infer genres from TMDB. Quest badges are local gamification and are not proof of ticket purchase.

## Safety before production

Use a backup/Git commit before editing. Keep API secrets out of source control. Test `npm run build` and `npm test`, test the existing TMDB and card-studio flows, and review Firebase rules before publishing.
