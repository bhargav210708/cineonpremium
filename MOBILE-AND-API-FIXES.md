# Cinéon production fixes in this release

## TMDB connectivity on mobile networks
- Production movie API requests now use the same-origin `/api/tmdb` Vercel function instead of calling `api.themoviedb.org` directly from the phone browser.
- The function keeps the TMDB Read Access Token server-side, restricts requests to resource paths used by Cinéon, forwards API status messages, applies a short upstream timeout, and enables Vercel shared caching.
- Local Vite development continues to use `VITE_TMDB_TOKEN` from `.env.local`.

### Required Vercel environment configuration
1. Add `TMDB_READ_ACCESS_TOKEN` with your TMDB API Read Access Token.
2. Apply it to Production (and Preview only if you intend to test preview deployments).
3. Remove `VITE_TMDB_TOKEN` from Vercel once the server-side variable is configured; VITE-prefixed values are public browser-build variables.
4. Redeploy the project after saving environment variables.

## Ticket export corrections
- The exported ticket now includes only the selected screening format rather than a grid of all available formats. The on-screen grid remains interactive as an editor control.
- Poster crop zoom cannot shrink below cover size, preventing blank/uncovered edges in exported artwork.
- The preview crop background no longer repeats, and the zoom slider minimum is set to the cover baseline.
- Existing ticket styles, shapes, reverse side, PNG/JPEG/WebP/PDF/SVG export options, story format, and saved drafts are preserved.

## Mobile layout
- Retains safe-area-aware mobile header and bottom navigation, avoids horizontal overflow, and keeps ticket editor controls within the viewport. Test routes on an actual phone after deployment.

## Deployment note
The source archive is patched, but deployment credentials and the user's Vercel environment cannot be changed from this archive. Configure the server-only token in Vercel and deploy before expecting the proxy to work in production.
