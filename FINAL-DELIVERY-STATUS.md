# Cinéon — updated delivery status

This updated archive keeps the existing cinema-suite features and adds the S Pen diary, Google Maps shortcuts for nearby cinemas and ticket missions, community image/video attachments, route-origin transitions, PWA icons/install support, and the Cinéon brand. Ticket export options remain PNG, JPEG, WebP, PDF and SVG (SVG wraps the rendered raster ticket and is not an editable vector).

## Checks completed in this environment
- TypeScript/TSX syntax transpilation: passed for all 25 `.ts`/`.tsx` files.
- `public/manifest.webmanifest`: valid JSON.
- `public/sw.js`: JavaScript syntax check passed.
- ZIP integrity: will be checked on the packaged archive.

## Checks blocked / limitations
- `npm install` timed out due unavailable npm registry access. Full TypeScript typecheck, production build, tests, lint and real browser/device QA could not be completed.
- Nearby cinema discovery uses OpenStreetMap public data, with Google Maps search links (no embedded Maps SDK/API key). Geolocation is permission-based.
- Premiere Radar has location-aware search links and an optional 60-second foreground monitor adapter (`VITE_RADAR_MONITOR_URL`). A live BookMyShow/District detector is not bundled because there is no universal public browser API; an authorised provider integration and deployed background scheduler/push service are required for genuine background ticket alerts.
- Firebase is optional. Cross-device media posts require Firebase Auth, Firestore and Storage, plus deployment of the included security rules. Without those services, small media attachments are local-only.

## Run
1. Extract the ZIP.
2. Copy `.env.example` to `.env.local` and set `VITE_TMDB_TOKEN`.
3. Run `npm install`, then `npm run dev`.
4. For production release, run `npm run typecheck`, `npm test`, `npm run lint`, and `npm run build` on a machine with registry access, then test S Pen input on a compatible phone and PWA install on target devices.
