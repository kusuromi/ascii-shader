# Changelog

All notable changes to this project are documented in this file.

## [Unreleased]

### Added

- `serializeAsciiSettings(settings)` in core returns only the settings that differ from the defaults, rounded for copying.
- A "CODE" panel next to "SETTINGS" has an Install section (npm, pnpm, yarn, bun) and a Code section that shows the current settings as a React component (`"use client"` included) or JSON. The code can be copied from the panel and from its collapsed bar. The code panel is wider than the settings panel, and the code is syntax-highlighted.
- Click ripples: a `ripple.enabled` setting (on by default) sends a ripple through the field on each click. The host keeps the four most recent ripples and passes them to the renderer as `ripples`.
- Ripple settings in the panel and in `ripple`: `enabled`, `strength`, `speed` (fraction of the shorter screen side per second), `wavelength` and `width` (CSS px), and `decay`.
- Edge vignette: a `vignette.enabled` setting (off by default) dims glyphs toward the screen edges with a smooth fade. `vignette.radius` sets the band width (% of the shorter screen side), `vignette.edgeLevel` sets how dim the glyphs get at the very edge, and `vignette.sides` chooses the edges (`top`, `right`, `bottom`, `left`, all on by default). The panel has a "Vignette" section for these settings.
- Playwright tests for the vignette run against the real shader in headless Chrome (`npm test -w @kusuromi/ascii-shader-renderer`).

### Changed

- The settings and code panels grow with their content and stop at the screen edge with a 12px margin, instead of always filling the height.
- Pointer movement and clicks over the settings panel no longer move the cursor or create ripples. Elements marked with `data-ascii-ignore-pointer` are excluded.
- The settings panel is 12px from the screen edges and fills the height down to the bottom edge.
- The vignette transition is gradual: glyphs near the edge taper toward the sparser characters of the ramp instead of cutting off.


- The `AsciiSettings` type now includes `ripple` and `vignette`. Code that builds full `AsciiSettings` objects by hand must add them; `normalizeAsciiSettings` fills in the defaults.

## [react 0.5.0] - 2026-10-06

### Changed

- `AsciiShaderBackground` is now fixed to the viewport and sized with `100dvh`, so it follows the visible screen as browser controls change.
- The background no longer depends on the height or positioning of its parent.

### Breaking Changes

- `AsciiShaderBackground` now covers the viewport instead of a parent section. Use `AsciiShader` with a custom layout when you need a background limited to part of a page.

## [react 0.4.0] - 2026-10-06

### Fixed

- Fixed the package dependency chain: React now uses renderer `0.3.0`, which brings in core `0.2.0` and its viewport-resize fixes. React `0.3.0` still resolves renderer `0.2.0` and core `0.1.0`.
- React `0.3.0` is already published and cannot be changed. Upgrade to React `0.4.0` to get the corrected dependency chain.

## [core 0.2.0] - 2026-10-06

### Fixed

- Recalculate canvas dimensions on `visualViewport` resize and after `orientationchange`, avoiding Safari's temporary intermediate size after rotation.
- Remeasure the canvas when the page returns to the foreground.
- Apply settings changes even while the shader is paused or reduced motion has stopped its animation loop.
- Remove viewport listeners and the pending orientation timer when the engine stops.

## [renderer 0.3.0] - 2026-10-06

### Changed

- Updated the core dependency to `0.2.0`, so renderer users receive the canvas viewport-resize fixes.

## [react 0.3.0] - 2026-10-06

### Added

- Added `AsciiShaderBackground` to place the shader behind page content.
- Extend the background at least `62px` above its parent (`max(env(safe-area-inset-top, 0px), 62px)`) to cover the iOS status-bar area even when Safari reports a zero safe-area inset.
- Stretch the layer between the parent's top and bottom, so it follows growing page content without a fixed bottom runway or extra page scroll.

### Breaking Changes

- The parent must be `position: relative` and provide the area the background should cover.
- The background no longer requires a `scrollTo` workaround or forced page scrolling.

## [renderer 0.2.0] - 2026-10-05

### Changed

- Texture detail now uses a consistent pixel scale instead of changing with screen dimensions.
- The public API and cursor behavior are unchanged.

### Fixed

- Keep the texture's proportions by cropping it to the canvas instead of stretching it.
- Prevent texture detail from becoming excessively fine on narrow screens.

### Breaking Changes

- The visual output changes even though the API does not. Recheck and retune existing `frequency` and `lightness` settings.
