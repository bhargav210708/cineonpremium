Cinéon desktop/laptop usability update

Changes in this build:
- Featured homepage carousel now has explicit previous/next controls, selectable slide indicators, and a pause/resume autoplay control. Autoplay respects low-power mode.
- Added a Liquid-glass intensity slider in Settings & privacy > Appearance. It persists to localStorage and applies blur/translucency variables immediately; default 45%.
- Improved desktop/mobile overflow behavior to reduce content clipping and made the hero section overflow visible for its controls.

Verification:
- Source changes were applied and reviewed locally.
- `npm install --no-audit --no-fund` timed out in this environment, so dependencies could not be fully installed and `npm run build` could not be verified here.
- TMDB features require a valid VITE_TMDB_TOKEN in .env.local. Firebase-only features require the matching Firebase config.
- The slider changes control glass surfaces that use the existing glass styling; not every component in the app uses a glass surface.
