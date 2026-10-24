# Cinéon — Living Cinema homepage update

## What's changed

- Redesigned the Discover homepage with an auto-advancing featured-film slideshow using TMDB backdrop and poster artwork.
- Added slide indicators, a featured-film action, and a scroll cue to help people discover the content below the fold.
- Added quick-information cards for the user's saved collection, nearby cinemas, and mood discovery.
- Added mood-world cards with distinct atmospheric treatments (desert epic, doom & dread, neon after dark, romance, and wonder).
- Added mood-led poster-card treatments based on movie title and TMDB genre IDs. Dune-like titles get desert/arrakis treatment, doomsday/apocalypse titles get a red end-of-days treatment, and other genres receive tailored colour atmospheres.
- Expanded movie detail streaming information for India into subscription, rent, and buy sections with provider logos and the TMDB/JustWatch offer link where supplied.
- Added global vertical scrolling safeguards and responsive rules to address the reported inability to scroll down in Chrome.
- Preserved existing routes and Cinéon feature modules.

## Run locally

1. Keep your existing project as a backup.
2. Extract this ZIP and open the `CINÉON` folder in VS Code.
3. Add your TMDB API Read Access Token to `.env.local`:

   ```env
   VITE_TMDB_TOKEN=your_tmdb_api_read_access_token
   ```

4. Install dependencies and start the app:

   ```powershell
   npm install
   npm run dev
   ```

5. Check the production build:

   ```powershell
   npm run build
   ```

## Notes

- Featured slides, movie data, and India streaming offers depend on TMDB responses and the configured token.
- Streaming availability can change; verify offers with the provider. If TMDB has no India provider data, the detail page says so instead of guessing.
- Movie poster atmosphere effects are CSS overlays and do not claim to be official franchise artwork. Existing TMDB posters remain the source artwork.
- This update does not turn local-only cinema submissions or watch-party previews into shared live services; those still require configured backend integration.
