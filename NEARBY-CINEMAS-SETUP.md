# Nearby Cinemas addition

This addition keeps the existing `cinemas` page and adds a separate `cinemas-nearby` route.

## Files added/updated
- Added `src/features/cinemas/NearbyCinemas.tsx`
- Updated `src/main.tsx` to lazy-load the page at `/cinemas-nearby`
- Updated `src/components/Layout.tsx` to add a Nearby cinemas navigation link
- Removed the unavailable `@types/qrcode-generator` dependency from `package.json` (the project should use the package's own types if needed).

## Run
```powershell
npm install
npm run dev
```
Then open `/cinemas-nearby` on the local Vite URL.

## Current limitations
The cinema directory is saved in the current browser's localStorage. It does not automatically discover real venues or sync submissions between users. Submitted cinema and screen data is explicitly marked unverified. Location permission is optional and only sorts entries already saved in this browser.


## Google Maps links
Nearby results still use OpenStreetMap's public place data for lightweight discovery. Every result opens a Google Maps place search, and the page can open a nearby-cinema search centered on the user's permitted coordinates. Cinéon does not embed the full Google map, avoiding a Maps JavaScript API key and reducing page weight. Listings may be incomplete where map data coverage is sparse.
