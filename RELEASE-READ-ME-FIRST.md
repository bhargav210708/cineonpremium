# Cinéon — read before running

## New in this release candidate
The Ticket Atelier includes poster crop/reposition controls, ticket silhouettes, a character-edition reverse, saved local ticket drafts, QR generation, and an export format selector for PNG, JPEG, WebP, PDF and SVG.

### Export formats
- **PNG** — best for lossless sharing and transparent-capable image workflows (the ticket artwork itself is rendered on a solid design background).
- **JPEG** — broadly compatible, smaller files.
- **WebP** — compact; browsers without WebP canvas export fall back to PNG and use the `.png` extension.
- **PDF** — a single-page PDF with the rendered ticket image, suitable for printing/sharing.
- **SVG** — an SVG wrapper containing the rendered ticket as an embedded raster image. It is not a fully editable vector design file.

The export applies to whichever ticket side is currently displayed. Choose the desired format in **Export your ticket** before pressing the download/share action.

## Start the app
1. Extract the ZIP.
2. Copy `.env.example` to `.env.local`.
3. Set `VITE_TMDB_TOKEN` to your TMDB API read access token.
4. Open a terminal in the extracted project folder and run `npm install`.
5. Run `npm run dev` and open the address printed by Vite.

## Other additions in this update
- **Cinéon** is the new product name; the legacy `CINÉON.*` local-storage keys are intentionally retained to preserve existing browser data.
- **S Pen Diary** at `/stylus-diary`: stylus-only inking, paper-page flip, local save, image export and native share. Touch and mouse input cannot draw; browsers must report the S Pen as `pointerType: pen`.
- **Nearby cinemas** opens Google Maps search links without embedding a map or showing distance figures. Geolocation is requested only when the user taps the location button.
- **Community Feed** supports image/video attachments, previews and native/external sharing. Firebase Auth + Storage + Firestore enable cross-device public posts and larger media; otherwise small media is local-only and size-limited.
- **Navigation transitions** originate near the selected sidebar destination. PWA icons, manifest and install prompt are included.

## Important limitations
- This archive has not passed a full production build or live browser QA in the current environment because npm dependencies could not be installed here. Run the project checks locally before production use.
- Premiere Radar can check a configured `VITE_RADAR_MONITOR_URL` about once per minute while the page is open. No BookMyShow/District provider-specific live detector is bundled: automatic verified availability requires a permitted provider data source and deployed monitoring service. A browser-only page cannot keep polling after it is closed; background phone alerts require push delivery.
- Cross-device public media requires valid Firebase Auth/Firestore/Storage configuration and deployment of the included Firestore and Storage rules. QR/profile resolution also needs Firebase configuration.
