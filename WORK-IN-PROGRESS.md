# Cinéon — Working implementation status

This source folder contains the ongoing redesign work. It is **not a release-ready/final archive** yet.

## Added in this work session
- Ticket Atelier: pointer/touch poster reframing, precision crop sliders, five ticket silhouettes, user-supplied compressed character artwork, custom accent/typeface controls, local draft save/load/delete, separate front/reverse PNG export, and a generated QR on the reverse.
- Public profile QR destination: `/profile?handle=...` can display a public profile when Firebase is configured and that handle is published with public visibility. The QR contains a URL only; it never embeds login credentials.
- Discovery: India now-playing source for the hero, 16 matching mood shortcuts, language/year/genre/rating/sort filters, pagination, session-persisted filter/page state and return-to-scroll behaviour.
- Mood Engine: Stay in this mood / Go deeper / Change atmosphere controls and visible recommendation rationale based on the chosen mood and explicit filters.
- Atmosphere: movie-card hover/focus changes the ambient poster field; card movement is restrained and disabled/reduced on mobile/reduced-motion settings.
- Liquid Glass: Crystal/Balanced/Atmosphere presets and independent transparency, blur, edge and shadow controls.
- Personal suite: public-list share links, Director's Cut Overview/Deep Dive/Collector modes, genre-metadata relationship trails in Cinema Galaxy, tag-derived Film DNA dimensions, contextual feature nudges, Instant/Minimal/Cinematic opening credits, shared film-accent styling and activity-based ticket stamps.

## Verification status
- TypeScript/JSX syntax transpilation passed for all 23 TS/TSX source files.
- Full `npm install` timed out because the package registry could not be reached in this environment.
- `npm run typecheck`, `npm test`, `npm run lint`, `npm run build`, and live browser/device QA have **not passed** and must not be assumed to pass.
- Premiere Radar still saves local missions and can test browser notification permission. Real ticket release/availability alerts require a permitted booking-data integration and a deployed server-side monitor. This is not represented as live monitoring.

See `IMPLEMENTATION-MASTER-CHECKLIST.md` for remaining acceptance criteria. Do not label or distribute this folder as final until all remaining release gates are verified.
