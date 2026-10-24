# Cinéon release verification

## Applied in this handoff
- Public brand changed to Cinéon in the web title, install metadata, navigation wordmark, onboarding reveal, user-facing copy, and PWA icons.
- Existing application source was retained as the base; changes were layered onto the existing code rather than replacing the app with a new scaffold.
- Added a Cinematic Identity card to Profile: diary-derived archetype, local signature-film selector, and identity stats.
- Existing feature areas for Ticket Atelier, Cinema Galaxy, Mood Engine, cinematic discovery, diary/chronicle, movie details, appearance/workspace presets, Ctrl+K command palette, and Premiere Radar are retained.
- Legacy `cinetribe.*` / `reelora.*` local-storage keys and `cinetribe:*` event names are intentionally preserved so existing browser data and cross-component updates are not silently orphaned.
- Ideas 11 onward from the brainstorm are not added as new features in this pass.

## Verification status
- TypeScript/TSX syntax transpilation: passed for 25 source files using the globally installed TypeScript transpiler.
- JSON metadata parse: checked as part of archive preparation.
- `npm install`: timed out in this environment, so dependencies could not be installed.
- Full `npm run typecheck`, `npm test`, `npm run lint`, `npm run build`, and browser/device testing: **not verified** here because project dependencies were unavailable. Run them after installing dependencies in a network-enabled environment.

## Run locally
1. Extract the ZIP.
2. Open a terminal in the `Cineon` folder.
3. Copy `.env.example` to `.env.local` and add your TMDB read token if you want live film data.
4. Run `npm install`.
5. Run `npm run dev`.
6. Before deployment, run `npm run typecheck`, `npm test`, `npm run lint`, and `npm run build`.

## External service boundaries
- TMDB discovery requires the user's TMDB API token.
- Firebase account/cloud/social features require a Firebase project and correct security rules.
- Premiere Radar's live booking alerts require a permitted booking/release data source, a deployed monitor backend, and configured notifications. The interface alone does not mean minute-by-minute monitoring is active.
