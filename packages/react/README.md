# @kusuromi/ascii-shader-react

Animated, interactive, GPU-rendered ASCII shader for React. Includes `AsciiShaderBackground` for a full-viewport background, an optional settings panel, and a localStorage settings hook.

Rendering is WebGL-only (`@kusuromi/ascii-shader-renderer`); the animation loop is driven by `@kusuromi/ascii-shader-core`'s engine host. Without a WebGL context the component renders a black background.

## Install

```bash
npm install @kusuromi/ascii-shader-react @kusuromi/ascii-shader-core @kusuromi/ascii-shader-renderer
```

## Basic usage

```tsx
import { AsciiShaderBackground } from "@kusuromi/ascii-shader-react";

export function Hero() {
  return (
    <section style={{ position: "relative", minHeight: "100lvh" }}>
      <AsciiShaderBackground />
      <div style={{ position: "relative", zIndex: 1 }}>
        Your content
      </div>
    </section>
  );
}
```

`AsciiShaderBackground` renders an absolute, pointer-transparent shader layer with a top bleed of `max(env(safe-area-inset-top, 0px), 62px)`. Its `top` and `bottom` insets with `height: auto` stretch it from the top bleed to the bottom of its containing block; there is no fixed bottom runway or page-scroll offset. The layout is static and does not depend on JavaScript toggling a class. Give the parent that should define the background area `position: relative` and a meaningful height (for example, `min-height: 100lvh`); normal-flow content can make that parent taller than the viewport.

The parent must establish the intended containing block. Flex and grid parents do not inherently disable the absolute layer's explicit `top`/`bottom` sizing, but make sure the positioned parent's box has the height you want the shader to cover. An ancestor with `overflow: hidden` clips anything outside its bounds, including the 62px top bleed; it does not ignore `bottom` or collapse the layer's height. Avoid that clipping when the shader must extend into the safe area. If you need a viewport-fixed background independent of the content height, or a scroll-driven effect, use a `position: fixed` layer for that use case. `AsciiShader` remains available for shader instances embedded in other layouts.

## With controls

```tsx
import {
  AsciiShaderBackground,
  AsciiControls,
  usePersistentAsciiSettings,
} from "@kusuromi/ascii-shader-react";
import "@kusuromi/ascii-shader-react/styles.css";

export function Demo() {
  const { settings, setSettings, resetSettings } =
    usePersistentAsciiSettings();

  return (
    <main style={{ position: "relative", minHeight: "100lvh" }}>
      <AsciiShaderBackground {...settings} />
      <AsciiControls
        value={settings}
        onValueChange={setSettings}
        onReset={resetSettings}
      />
    </main>
  );
}
```

For edge-to-edge rendering into iOS safe areas, the host page must opt in via its viewport meta tag (`viewport-fit=cover`). A React component cannot safely change page-wide viewport metadata or control Safari's browser chrome.

## Main props

| Prop | Type | Default |
| --- | --- | --- |
| `glyphs` | `string` | `" .,:;!*oO0&8@"` |
| `glyphCount` | `number` | `10` |
| `cellSize` | `number` | `13` |
| `frequency` | `number` | `2.4` |
| `speed` | `number` | `0.85` |
| `lightness` | `number` | `0.92` |
| `contrast` | `number` | `1.24` |
| `opacity` | `number` | `0.82` |
| `cursor` | `Partial<AsciiCursorSettings>` | enabled, strength 0.34, radius 24, follow 0.06 |
| `paused` | `boolean` | `false` |

Values are clamped to `SETTING_LIMITS` via `normalizeAsciiSettings`. The component pauses outside the viewport and on hidden tabs, respects `prefers-reduced-motion`, caps the device pixel ratio at 2, and recovers from WebGL context loss.
