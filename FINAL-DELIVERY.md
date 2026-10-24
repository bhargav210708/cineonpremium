# Cinéon final delivery notes

## Included in this source bundle
- TMDB-powered discovery, movie details and the Living Ticket studio.
- Ticket poster selection, editable ticket details, optional rating/review, front/back preview, parallax depth options, PNG export and share action.
- Film-aware exported ticket palette/title treatment for recognizable themes such as desert/sci-fi (Dune), horror, romance and noir/crime, while retaining the chosen finish for other films.
- Discover carousel previous/next controls, slide indicators and autoplay pause/resume.
- Liquid-glass intensity control in Settings; value persists in local storage and updates the app CSS variables.
- Cinema Lab mood discovery, Film Museum, director search, personal chronicle and local watch-party planning.
- Nearby cinema lookup via browser location/OpenStreetMap, with unverified community-submitted entries clearly marked.
- Local-first diary, lists, profile, stats, social/tribe and settings screens, plus Firebase/Cloud Functions scaffolding and rules.
- Responsive styling and reduced-motion handling in existing UI.

## Important implementation boundary
Several workspace features are **local-first**, stored in this browser's localStorage; they are not a fully synchronized multi-user social service. Live shared voting, social-feed persistence/moderation, push notification delivery and App Check enforcement still require backend integration/configuration. Cinema listings depend on OpenStreetMap coverage. The ticket's QR-like decorative pattern is a visual serial motif, not a scannable ticket credential.

## Run on Windows
1. Install Node.js 20 or newer.
2. Extract this ZIP into a folder.
3. Copy `.env.example` to `.env.local`.
4. Add your TMDB API Read Access Token to `VITE_TMDB_TOKEN` in `.env.local`. Keep private provider keys out of `VITE_*` variables.
5. In the project folder, open PowerShell or Terminal and run:
   ```powershell
   npm install
   npm run dev
   ```
6. Open the local URL printed by Vite (normally `http://localhost:5173`).
7. Before deployment, run `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build`.

Firebase features additionally require your own Firebase web-app configuration and deployment. See `README.md` and `.env.example`.

## Verification status
ZIP archive integrity was checked after packaging. Dependency installation timed out in the authoring environment, so TypeScript, lint, tests and production build could not be executed here. Treat this as a consolidated project delivery, not a claim that all features have been runtime-verified or that backend services are configured.
