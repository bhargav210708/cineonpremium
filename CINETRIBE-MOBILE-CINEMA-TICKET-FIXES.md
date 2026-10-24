# Cinéon — Mobile, Nearby Cinemas & Memory Relic Ticket Update

## What changed

- Nearby Cinemas now requests device location and queries live OpenStreetMap / Overpass data for mapped cinema venues inside the selected radius.
- City/area search geocodes the search text through OpenStreetMap Nominatim, then scans the surrounding area.
- Venue cards show approximate distance and provide Google Maps directions. Screen formats are not guessed; mapped venues can have no screen data.
- Mobile layout uses the device safe areas, prevents horizontal overflow, and adds a five-item bottom navigation bar.
- Ticket PNG rendering now tries a CORS-safe fetch first and then a CORS-enabled image load. If the poster CDN cannot be reached, it still exports an original cinematic artwork treatment rather than failing the entire export.
- The exported ticket has a collector-style “Memory Relic” treatment: perforated edges, dashed tear-off divider, orbital foil motif, serial number and decorative micro-pattern.

## Notes

- Location scanning needs a secure context (HTTPS, or localhost during development) and the user's location permission.
- Cinema discovery relies on OpenStreetMap coverage and the public Overpass/Nominatim services. Some theatres may be missing or have incomplete names/addresses. It does not provide live showtimes or ticket availability.
- PNG export was syntax-checked, but a full dependency-backed production build could not be run in this environment because package installation timed out. Run `npm install` and `npm run build` locally before deployment.
