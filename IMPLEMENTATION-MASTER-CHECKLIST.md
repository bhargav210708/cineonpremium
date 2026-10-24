# Cinéon — Master Implementation Checklist

This is the acceptance checklist for the requested full redesign. A feature is only GREEN after implementation and verification; a route, placeholder, or visual mock alone does not count.

## Ticket Atelier
- [x] Adjustable horizontal/vertical poster framing and zoom controls in the editor.
- [x] Five silhouette choices in the editor and matching silhouette clipping in PNG export.
- [x] Character-edition text on ticket reverse.
- [x] Save, reload, and delete multiple local ticket design drafts per movie.
- [x] Direct pointer/touch drag on the poster preview, alongside precision sliders (implementation added; real-device interaction still needs QA).
- [ ] Verify preview crop exactly matches export on multiple poster aspect ratios in a real browser.
- [x] Replace decorative pseudo-QR artwork with a real QR encoding the public profile handle URL; the destination resolves across devices only when the owner publishes the profile through configured Firebase.
- [x] Custom title typeface and accent colour controls.
- [x] Export selector supports PNG, JPEG, WebP, PDF and SVG image-container output; unsupported WebP browsers fall back to PNG with the matching extension.
- [ ] Custom border treatments, editable stamp controls and richer front/back layout controls remain unfinished.
- [ ] Verify each silhouette's final layout and mobile interaction.

## Liquid Glass / Visual Profiles
- [x] Added layered glass surfaces, specular edge highlights, saturation and depth shadows.
- [x] Added calmer glass rendering for low-power mode.
- [ ] Verify visual quality against the supplied reference in a real browser.
- [x] Added Crystal/Balanced/Atmosphere presets and independent opacity, blur, edge and shadow controls.
- [ ] Verify contrast safeguards and readability across transparency extremes, themes and OLED/light modes.
- [x] Cinema/Explorer/Collector/Compact workspace selectors and Premiere/Noir/Cosmic/Archive/Pure visual identity selectors exist.
- [ ] Verify preset coverage and visual consistency across every route.
- [ ] Verify readability across light/dark/OLED and transparency extremes.

## Discovery / Mood Engine
- [x] Added more mood choices (16 total) and multi-page TMDB discovery result navigation.
- [x] Pagination carries the current mood/filter/sort request to the selected page.
- [ ] Verify API behaviour with a valid TMDB token and filters that return sparse pages.
- [x] Added Stay-in-mood / Go-deeper / Change-atmosphere controls and recommendation reason labels.
- [ ] Verify recommendation relevance and TMDB API behaviour with a valid token.
- [x] Added genre, language, year, minimum-rating and sort filters; pagination state and return-to-scroll persistence are implemented.
- [ ] Verify full catalogue filter combinations and return-to-scroll behaviour in a live browser.
- [x] Added an ambient poster field that responds to movie-card hover/focus and restrained card lift/lighting.
- [ ] Verify layering, performance and keyboard/touch behaviour in a live browser.

## Existing and planned suite
- [ ] Audit every route and preserve all existing working functionality.
- [x] Added Director's Cut Overview / Deep Dive / Collector modes to movie detail pages; live route QA remains outstanding.
- [x] Added genre-metadata relationship trails to Cinema Galaxy.
- [ ] Complete actor/director/franchise/theme connections and deeper activity-driven personalization.
- [x] Added Film DNA dimensions calculated from the user's own descriptive diary tags.
- [ ] Add stronger TMDB genre/pace/tone signals and verify explainability with real diary data.
- [x] Ctrl+K command bar and a public-handle profile view for scannable ticket QR links exist.
- [x] Public list share links that render a portable collection view.
- [x] Added a dismissible contextual homepage nudge that changes as the user saves films/creates ticket drafts.
- [ ] Verify contextual discovery across milestones; public profile QR resolution requires configured Firebase and a public profile.
- [x] Added activity-based VIEWED / REWATCH / FAVOURITE / REVIEWED stamps to ticket previews and front exports.
- [ ] Verify ticket vault persistence, achievements, Chronicle, diary privacy, and collection editing.
- [ ] Complete mobile/touch and laptop-at-100%-zoom testing.

## Premiere Radar live monitoring
- [x] Mission form, local persistence, notification permission, and honest test notification.
- [ ] Select a permitted/authorised live availability source for each booking provider.
- [ ] Implement scheduled server monitoring, release/availability verification, deduplication and monitoring history.
- [ ] Implement push delivery and emergency-mode behaviour.
- [ ] Test actual alerts against a real, authorised provider integration.

## Current working-copy progress (not release-verified)
- Added direct drag-to-reframe on the ticket artwork, compressed user-supplied character artwork for the reverse, custom accent/typeface controls, separate front/reverse export in PNG, JPEG, WebP, PDF and SVG image-container formatss, and a real QR on the reverse.
- Added 16 homepage mood links that select the matching Mood Engine mood, an India now-playing hero source, catalogue genre/rating/sort filters, ambient poster hover, session-persisted discovery filters/page, and a place-restoring return path.
- Added public-list share links that open a portable collection view without exposing private lists.
- Added Director's Cut modes, metadata-based Cinema Galaxy relationship trails, diary-tag-driven Film DNA dimensions, contextual feature nudges, and a shared film-accent identity helper across cards/detail pages.
- Added activity-based ticket stamps and a selectable opening-credits mode.
- Added Liquid Glass presets and separate blur/edge/shadow controls.
- Syntax-transpilation passed for all 23 TS/TSX source files. This is not a substitute for TypeScript type-checking, a production build or browser QA.

## Release gates
- [ ] `npm install` succeeds in a network-enabled environment.
- [ ] `npm run typecheck`, `npm test`, `npm run lint`, and `npm run build` pass.
- [ ] Browser QA passes for desktop, laptop, and phone sizes.
- [ ] No unsupported claims about live booking detection.
- [ ] Archive integrity and clean extraction/run instructions verified.

> Note: dependency installation timed out because the npm registry is unreachable in this environment. Full type-check/build, automated tests, lint and browser/device QA remain blocked. Premiere Radar also remains a local mission/notification-permission interface until a permitted live provider source and deployed server monitoring credentials are available. This checklist intentionally leaves unverified items unchecked rather than declaring them complete.


## Latest Cinéon-specific additions (2026-10-23)
- [x] Rename user-facing brand to Cinéon while retaining legacy local-storage keys.
- [x] Add stylus-only handwritten diary route with local page persistence, paper-turn transition, image export and native share.
- [x] Add Google Maps search links to nearby cinema results; remove visible distance values and avoid embedded map overhead.
- [x] Add permission-based city inference to Premiere Radar, provider-scoped search shortcuts and Google Maps theatre search.
- [x] Add optional foreground monitor endpoint polling every 60 seconds, explicit availability contract and deduplicated notifications.
- [x] Add image/video attachments to Community Feed with previews and native/external sharing; optional Firebase Storage/Firestore publishing.
- [x] Add public community media Storage rules, PWA icons/manifest/install prompt, and low-cost route-origin transitions.
- [ ] Live provider-specific ticket detection and background push remain blocked on a permitted data source and deployed backend.
- [ ] Full build, tests, lint and device/browser QA remain unverified because npm dependency installation timed out.
