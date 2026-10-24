# Cinéon Lightworks + mobile ergonomics update

This update layers a reusable lighting/material system onto the existing Cinéon project; it does not replace existing routes or feature modules.

## Added
- Lightworks console with persistent lighting presets: Golden Premiere, Moonlit Archive, Crimson Noir, Bioluminescence and Reference Neutral.
- Adjustable light intensity, direction and diffusion.
- Three material treatments: smoked crystal, optical glass and satin diffusion.
- Atmosphere and Reference workspaces, with reset controls.
- Shared CSS tokens for ambient lighting, material edges and depth; contextual material/background treatments.
- Mobile-accessible floating Lightworks control and scrollable bottom-sheet-like console.
- Safe-area-aware mobile bottom navigation, touch ergonomics, responsive hero/catalogue layout, landscape handling, overflow containment and reduced-motion behavior.

## Notes / verification
- The rig is a CSS-based lighting simulation, not a physically accurate renderer.
- Preferences are saved in `localStorage` under `cineon.lightRig`.
- Existing application preferences continue using their prior storage keys to avoid breaking user settings.
- Build verification was attempted but cannot currently pass in this environment because project dependencies (React, Vite, lucide-react, etc.) are absent from `node_modules`. Run `npm install` and then `npm run build` locally to verify against the package manifest.
- This update has not been browser/device tested here; please verify on an actual phone and desktop browser after installing dependencies.
