# Cinéon Archive Redesign

## Implemented in this delivery
- Replaced the homepage mood-card grid with a dynamic Great Film Shelf using TMDB discover data, rating >= 8.0 and a minimum vote count to avoid tiny-sample rankings.
- Added a horizontal poster shelf with selected-film pop-forward treatment and a compact detail panel, rating, year, language, synopsis, Explore Film, and Make a Ticket actions.
- Applied the charcoal / warm-white / restrained vermilion archive palette across navigation, buttons, forms, movie cards, panels, and mobile navigation.
- Added layered glass surfaces with transparency, backdrop saturation/blur, edge highlights, inner highlights and depth shadows.
- Standardised button/input sizing and responsive form grids to reduce overflow and overlapping controls.
- Removed homepage mood tiles; the Mood Engine remains available through navigation and its route.
- Slowed the first-visit intro to 8 seconds (minimal mode 3 seconds), added a projector-beam animation and kept Skip Intro.
- Kept the diary's paper material warm so it deliberately contrasts with the archive interface.
- Preserved existing routes, store, TMDB/Firebase integrations, ticket studio, diary, watchlist, cinema discovery, PWA assets, and the rest of the app source.

## Notes
- The Great Film Shelf is live TMDB data, not a hardcoded poster mockup. Local development requires `VITE_TMDB_TOKEN` in `.env.local`; Vercel production uses `TMDB_READ_ACCESS_TOKEN` in server-side environment settings.
- The shelf requires TMDB data to load. The rest of the catalogue remains accessible if the shelf request fails.
- The build and automated tests were not run for this delivery, per request. Please run them locally before deploying.
