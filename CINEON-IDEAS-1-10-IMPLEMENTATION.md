# Cinéon — Ideas 1–10 implementation handoff

This build carries forward the existing Cinéon codebase and changes the public product branding to Cinéon. Existing local-storage keys and event names are intentionally retained for backwards compatibility with user data.

## Feature areas included in the inherited application
1. Cinematic identity / Cinema DNA and profile.
2. Ticket Atelier / card studio.
3. Cinema Galaxy.
4. Mood Engine and paginated discovery.
5. Cinematic discovery homepage and movie cards.
6. Diary, archive, chronicle, and stats.
7. Movie details / Director's Cut information layers.
8. Experience and glass/theme settings.
9. Ctrl+K command palette.
10. Premiere Radar interface.

## Important status distinctions
- The UI and local-first workflows are part of the source.
- Features that depend on TMDB require a valid TMDB API key.
- Cloud sync/social discovery require Firebase configuration and appropriate rules.
- Premiere Radar is not represented as a guaranteed minute-by-minute booking monitor; live monitoring requires a permitted source, backend scheduler, and notification configuration.
- No production build or browser/device test is claimed until the commands below pass in the target environment.

## Run and verify
1. Copy `.env.example` to `.env.local` and fill only the services you use.
2. Run `npm install`.
3. Run `npm run typecheck`, `npm test`, `npm run lint`, and `npm run build`.
4. Run `npm run dev` and manually check laptop and mobile layouts, ticket export, theme controls, and navigation.

## Backwards compatibility
Legacy `cinetribe.*` and `reelora.*` localStorage keys and existing `cinetribe:*` custom events remain in place intentionally; changing these would risk hiding existing user data.
