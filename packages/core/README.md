# @kusuromi/ascii-shader-core

Engine host, settings, and shared types for the ASCII shader renderer. No rendering logic lives here — it belongs to `@kusuromi/ascii-shader-renderer`.

## Install

```bash
npm install @kusuromi/ascii-shader-core
```

## What it provides

- **`createAsciiEngineHost`** — the animation driver: requestAnimationFrame loop (60 fps), resize handling with device-pixel-ratio (capped at 2), pointer state with smoothing (`cursor.follow`), `prefers-reduced-motion` support, pause outside the viewport / on hidden tabs, and the WebGL context-loss/restore lifecycle.
- **Settings** — `DEFAULT_ASCII_SETTINGS`, `SETTING_LIMITS`, `normalizeAsciiSettings()` with clamping, `ASCII_GLYPHS`.
- **Types** — `AsciiSettings`, `AsciiCursorSettings`, `AsciiPointerState`, host frame/options types.

## Usage (raw, without React)

The host only orchestrates; pair it with `createAsciiShaderRenderer` from `@kusuromi/ascii-shader-renderer`:

```ts
import { createAsciiEngineHost } from "@kusuromi/ascii-shader-core";
import { createAsciiShaderRenderer } from "@kusuromi/ascii-shader-renderer";

const canvas = document.querySelector("canvas");
const gl = canvas?.getContext("webgl");
if (!gl) throw new Error("WebGL unavailable");

const renderer = createAsciiShaderRenderer(gl);
const host = createAsciiEngineHost({
  container,
  canvas,
  getSettings: () => settingsRef.current,
  getPaused: () => false,
  resize: () => {},
  render: (frame) =>
    renderer.render({
      width: frame.dimensions.width,
      height: frame.dimensions.height,
      time: frame.time,
      dpr: frame.dpr,
      settings: frame.settings,
      pointer: { currentX: frame.pointer.currentX, currentY: frame.pointer.currentY },
    }),
  context: {
    element: canvas,
    createRenderer: () => renderer,
    disposeRenderer: () => renderer.dispose(),
  },
});

// host.stop() when done
```

Use `@kusuromi/ascii-shader-react` when you need a ready React component.
