# Transparency slider and laptop viewport fix

## Changes in this update
- Added a clearly labeled **Glass transparency** range slider directly in the desktop sidebar, with a live percentage readout and a link to the full Settings page.
- Kept the same control in **Settings → Appearance → Liquid-glass intensity**.
- Both controls persist `cinetribe.glassIntensity` in local storage and update `--glass-intensity` and `--glass-blur` immediately; the controls synchronize through a custom browser event.
- Corrected the desktop content column sizing. The previous global `width: 100%` on `.main-content` combined with a fixed sidebar margin could make the content exceed the viewport and clip the right side. Desktop main content now uses `width: auto` beside the fixed sidebar.
- Kept vertical page scrolling and the sidebar's own overflow scrolling enabled.

## Verification
- Source inspection: passed.
- `npm run build`: attempted; blocked because required packages (including React, React Router, and lucide-react) are not installed/resolvable in this environment. TypeScript reports missing modules, so no production build can be claimed.
- Browser viewport tests: not run in this environment.
