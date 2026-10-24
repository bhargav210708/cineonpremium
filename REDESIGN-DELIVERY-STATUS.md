# Cinéon clean-slate UI redesign — delivery notes

## What changed in this pass
- Replaced `src/styles/global.css` wholesale with a new editorial cinema design system rather than appending another visual override to the old stylesheet.
- Removed the prior black/purple/gold visual language and repeated frosted-card treatment. The new direction uses warm gallery-paper surfaces, dark ink typography, restrained vermilion/brick accents, Playfair editorial display typography, mono metadata, asymmetric poster-led layouts, and glass only where it serves navigation or floating controls.
- Reworked shared visual treatments for navigation, homepage/featured canvas, film gallery, buttons, filters, movie details, ticket studio, diary paper, mood mixer, Cinema Galaxy, dialogs, mobile navigation, and responsive breakpoints while preserving existing React components, routes, state, and integration logic.
- Preserved normal document scrolling, responsive mobile navigation, focus-visible states, reduced-motion handling, and reduced-transparency fallback.

## Important limitation
This is a substantial UI stylesheet replacement, not proof that every item in the user's master specification has been implemented. Some requested concepts require component logic and/or data integration, not CSS alone. No production build, automated tests, lint, or browser/device visual QA could be completed because `npm ci --ignore-scripts --no-audit --no-fund` timed out in this environment. Do not treat the ZIP as build-certified until those checks pass.

## Verification to run locally
1. `npm ci`
2. `npm run build`
3. `npm test`
4. `npm run lint`
5. Test every route, ticket PNG export with real posters, diary save/reopen, TMDB, Firebase-configured and local-first modes, scroll behavior, and 320–430 px phone layouts.
