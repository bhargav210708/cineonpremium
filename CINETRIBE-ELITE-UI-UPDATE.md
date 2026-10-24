# Cinéon — Elite UI Update

## What this update adds
- Persistent workspace presets: **Cinema**, **Explorer**, **Collector**, and **Compact**. Presets make subtle layout-density adjustments without removing existing screens or data.
- Persistent visual identity profiles: **Premiere gold**, **Noir**, **Cosmic**, **Archive**, and **Pure / quiet**. They adjust accent tokens while keeping the core layout consistent.
- A global command bar opened with **Ctrl+K** (or **Cmd+K** on macOS). Search navigation destinations, use Escape to close, and click outside to dismiss.
- The existing dashboard/sidebar navigation remains in place, including the glass transparency slider, appearance theme selector, and mobile bottom navigation.
- Laptop-height sidebar spacing is tightened to reduce unnecessary scrolling. Sidebar itself remains independently scrollable when needed.
- Command bar entrance is brief and respects the project's reduced-motion CSS policy.
- CSS-only preset effects are intentionally restrained: discoverability is progressive rather than a wall of loud effects.

## Existing features retained
The update is layered on top of the existing app rather than replacing it. It retains TMDB discovery/search, movie detail pages, watchlist, ticket/card studio, diary, stats/passport, Cinema Galaxy, Cinema Lab/mood tools, Cinema DNA/quests, community/tribes, cinema reports and nearby cinemas, watch parties, profiles, notifications, AI assist, accounts/sync, and settings/routes already present in the project.

## Design direction
Cinéon is designed as a personal cinema suite: cinematic while exploring, personal while collecting, and effortless to use. Signature ideas such as Living Movie Tickets, Mood Worlds, Cinema Galaxy, Film Identity System, Opening Credits, Glass & Clarity Lab, and Cinema Chronicle remain the product direction; this update does not pretend that every future idea is fully implemented merely because it is in the roadmap.

## Verification status
- ZIP integrity: checked after packaging.
- Production build: **not verified**. `npm run build` was attempted, but this environment's `node_modules` is incomplete and cannot resolve core packages including React, React Router and Lucide React. Install dependencies with `npm install` in the project folder before running the build.
- Chrome visual/interaction testing: **not performed** in this environment. Please verify the actual target laptop/browser, especially at 100% zoom, before treating visual QA as complete.
- TMDB features need a valid API key configured through the documented environment file.
