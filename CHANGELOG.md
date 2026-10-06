# Changelog

All notable changes to this project are documented in this file.

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
