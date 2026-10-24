# Cinéon — release notes

## Added
- Rebranded the interface as **Cinéon — Your Personal Cinema Universe** while retaining legacy `cinetribe.*` storage keys to preserve existing browser data.
- Added the **S Pen Diary** at `/stylus-diary`. Its canvas accepts `pointerType === "pen"` only; touch and mouse cannot draw. Pages persist locally, turn with a lightweight book-page animation, and can export/share a PNG. A compatible browser/device must report the S Pen as a pen pointer.
- Added image/video attachments to Community Feed posts, previews, external/native sharing, and optional Firebase Storage/Firestore publishing. Local-only attachments are size-limited to avoid filling browser storage.
- Nearby cinemas now include Google Maps search links without embedding a map or showing distance figures. Geolocation remains opt-in.
- Premiere Radar can use the user's permitted location to infer a city, offers Google Maps theatre searches and provider-scoped booking searches, and supports optional one-minute foreground checks against a configured authorised monitor endpoint.
- Added PWA icon assets, install prompt support, updated manifest metadata and a versioned offline shell cache.
- Added a subtle route transition that originates from the selected sidebar item, using opacity and transforms to limit rendering cost.

## Provider and deployment requirements
- Ticket-release checks are not live by default. Configure `VITE_RADAR_MONITOR_URL` only with a permitted backend that returns verified availability signals. Direct BookMyShow/District scraping is intentionally not included. Background checks after closing the app require a deployed scheduler and push delivery.
- Cross-device public media requires Firebase Authentication, Firestore and Storage, plus deployment of the included `firestore.rules` and updated `storage.rules`. Without these services, small media attachments remain local to the browser.
- PWA installation requires HTTPS in deployment; localhost is supported for development. On iOS, use Share → Add to Home Screen.

## Validation status
TypeScript/TSX transpilation passed for 25 source files. The full TypeScript build, lint, tests and browser QA could not be completed because npm dependencies could not be installed in this environment (registry request timed out). This package should be treated as a modified release candidate, not as a fully browser-verified production release.
