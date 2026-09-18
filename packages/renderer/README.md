# @ascii-shader/renderer

The single WebGL renderer for the ASCII shader. Computes everything on the GPU in two passes, one pixel per grid cell.

## How it renders

1. **Field pass** — a fragment shader computes the per-cell luminance field: a float32 value-noise through `hash21` → `noise2` → 4-octave `fbm`, blended with two travelling waves and a sweep term, plus an optional pointer glow; final `pow(clamp(lum * lightness − 0.09, 0, 1), contrast)` is written to an RGBA8 texture (NEAREST). This shader is the single source of truth for the field formula.
2. **Composite pass** — a fullscreen quad samples the field, picks a glyph from a 16-column atlas (`floor(min(lum * glyphCount, …))`), shades it (188–246 of 255), and modulates alpha by glyph coverage (quantized to 0.01 steps).

The glyph atlas is rasterized once per settings change with a Canvas 2D context (the only 2D usage — text cannot be rasterized on the GPU), with vertical ink-centering baked in.

## Usage

```ts
import { createAsciiShaderRenderer } from "@ascii-shader/renderer";

const gl = canvas.getContext("webgl");
if (gl) {
  const renderer = createAsciiShaderRenderer(gl);

  function frame(time: number) {
    renderer.render({
      width: canvas.clientWidth,
      height: canvas.clientHeight,
      dpr: Math.min(window.devicePixelRatio || 1, 2),
      time,
      settings,
      pointer: { currentX: 0.5, currentY: 0.5 },
    });
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
```

The renderer pairs well with the animation loop, pointer tracking, and resize handling from `@ascii-shader/core`'s `createAsciiEngineHost`; for React, use `@ascii-shader/react` (which depends on `@ascii-shader/renderer` and `@ascii-shader/core`).

## Settings and pointer

`render` accepts the same `AsciiSettings` shape as the rest of the monorepo (see `@ascii-shader/core`) plus a normalized pointer position in `0..1` space.

## Lifecycle

- `debug()` — reads back the luminance field texture (`{ columns, rows, sample: number[] }`).
- `dispose()` — releases all GL objects.
- On `webglcontextlost`, dispose the renderer; on `webglcontextrestored`, create a new one — all GL objects are invalidated by the loss.