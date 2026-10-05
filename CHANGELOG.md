# Changelog

All notable changes to this project are documented in this file.

## [0.2.0] - 2026-10-05

### Changed

- Texture coordinates now use a fixed pixel scale through the shader constant `WORLD_SCALE = 1600`.
- Shader detail size no longer depends on screen dimensions.
- The API is unchanged, and cursor behavior is preserved.

### Fixed

- The texture is cropped to the visible canvas area instead of being stretched to fill it.
- Detail on narrow screens is no longer several times finer than on wide screens.

### Breaking Changes

- The visual output changes despite no API change. Recheck and retune `frequency` and `lightness` values configured for earlier versions.
