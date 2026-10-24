# Cinéon Cinema Immersion + Premiere Radar

## Added in this update
- New `/premiere-radar` destination in the desktop sidebar and mobile navigation.
- Premiere Radar mission builder with movie search via the existing TMDB integration, city, booking source, theatre, format, target date, and Normal/Emergency preference.
- Missions persist in this browser's localStorage and can be removed.
- Optional browser-notification permission and a test notification.
- A clear status panel explains that real-time ticket availability monitoring is not connected in this build.
- Premium glass surfaces, restrained hover depth, motion-aware styling, responsive mission cards, and catalogue pagination.
- Existing Cinéon routes and features remain in the project.

## Important limitation: ticket alert source integration
This update implements the user-facing tracking workflow, not a live ticket monitoring backend. It does not scrape BookMyShow or District, and it does not claim tickets are available. Real alerts require a permitted/authorised booking data source, a server-side scheduled monitoring service, verification/deduplication, and a push delivery setup. A browser tab cannot reliably poll sources every minute after it is closed.

## Run locally
1. Install Node.js LTS.
2. Extract the ZIP and open a terminal in the folder containing `package.json`.
3. Run `npm install`.
4. Copy `.env.example` to `.env.local` and configure `VITE_TMDB_TOKEN` with your own TMDB API Read Access Token.
5. Run `npm run dev` and open the local address printed by Vite.

The TMDB token is intended for this client-side demo setup; for a public production deployment, proxy sensitive or quota-critical API access through a backend. Browser notifications generally require localhost or HTTPS.


## Cinéon location and provider-search update
- The city field can be populated from browser geolocation after explicit permission; the exact coordinates are used only for reverse geocoding and are not stored in the mission.
- Mission cards open Google Maps theatre searches and provider-scoped searches for BookMyShow and District. These are shortcuts to current search results, not proof of availability.
- If `VITE_RADAR_MONITOR_URL` is configured to a permitted backend, the open Radar page POSTs each saved mission to it about once per minute. The backend must return `{ available: boolean, bookingUrl?: string, message?: string, checkedAt?: string, eventId?: string }`. `eventId` should identify a unique availability event for deduplication. The client will notify only when `available: true` is explicitly returned.
- No provider-specific scraper is bundled: these booking sites do not provide a universal public browser API, and direct scraping would be brittle and may violate their terms. Background monitoring requires a deployed scheduler and push service.
