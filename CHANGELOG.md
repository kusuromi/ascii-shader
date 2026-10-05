# Changelog

All notable changes to this project are documented in this file.

## [react 0.4.0] - 2026-10-06

### Fixed

- Restored the correct renderer dependency, `0.3.0` instead of `0.2.0`, so viewport remeasurement from core `0.2.0` is resolved.
- React `0.3.0` remains published with a stale renderer dependency and cannot be modified; consumers pinned to `0.3.0` should move to `0.4.0`.

## [core 0.2.0] - 2026-10-06

### Fixed

- Canvas dimensions are remeasured from `visualViewport` and after `orientationchange`, because Safari can report an intermediate container size after rotating.
- Canvas dimensions are remeasured when the page returns to the foreground.
- Settings changes force a repaint while paused or when `prefers-reduced-motion` has stopped the animation loop.
- Resize listeners and the orientation timer are removed when the engine host stops.

## [renderer 0.3.0] - 2026-10-06

### Changed

- Updated the core dependency to `0.2.0` to use viewport-aware canvas remeasurement.

## [react 0.3.0] - 2026-10-06

### Added

- Added `AsciiShaderBackground` for full-viewport shader backgrounds.
- Added an iOS top bleed of `max(env(safe-area-inset-top, 0px), 62px)` because Safari can return a zero safe-area inset in some states.
- Stretched the layer to its parent with `top`, `bottom`, and `height: auto`, covering documents of any length without adding page scroll.

### Breaking Changes

- `AsciiShaderBackground` requires a `position: relative` parent.
- The background no longer uses `scrollTo` workarounds; page scrolling is not required.

## [renderer 0.2.0] - 2026-10-05

### Changed

- Texture coordinates now use a fixed pixel scale through the shader constant `WORLD_SCALE = 1600`.
- Shader detail size no longer depends on screen dimensions.
- The API is unchanged, and cursor behavior is preserved.

### Fixed

- The texture is cropped to the visible canvas area instead of being stretched to fill it.
- Detail on narrow screens is no longer several times finer than on wide screens.

### Breaking Changes

- The visual output changes despite no API change. Recheck and retune `frequency` and `lightness` values configured for earlier versions.
