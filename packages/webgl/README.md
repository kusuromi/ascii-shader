# @ascii-background/webgl

WebGL renderer for an animated ASCII background. Produces the same picture as the
Canvas 2D renderer from `@ascii-background/core`, but computes the luminance field
on the GPU: noise runs in a fragment shader once per grid cell, and the glyph
composite is a single draw call.

## Usage

```ts
import { createAsciiShaderRenderer } from "@ascii-background/webgl";

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

The renderer pairs well with the animation loop, pointer tracking, and resize
handling from `@ascii-background/core`'s `createAsciiEngineHost`. If you use
React, prefer `@ascii-background/react`, which ships a ready-made component
with `engine="webgl"` support.

## Settings and pointer

`render` accepts the same `AsciiSettings` shape as the rest of the monorepo
(see `@ascii-background/core`) plus a normalized pointer position in `0..1`
space.

Call `dispose()` when the canvas is removed. On `webglcontextlost`, dispose the
renderer; on `webglcontextrestored`, create a new one — all GL objects are
invalidated by the loss.
