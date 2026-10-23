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
    <section style={{ minHeight: "100dvh" }}>
      <AsciiShaderBackground />
      <div style={{ position: "relative", zIndex: 1 }}>
        Your content
      </div>
    </section>
  );
}
```

`AsciiShaderBackground` renders a fixed, pointer-transparent layer covering the viewport (`100dvh`). It does not depend on the height or positioning of its parent and does not add page scroll. On Safari, the layer follows the dynamic viewport as browser controls expand and collapse, so its height can resize with the visible area. For safe-area edge-to-edge rendering, the host page must opt in via its viewport meta tag (`viewport-fit=cover`). A React component cannot change page-wide viewport metadata or control Safari's browser chrome. `AsciiShader` remains available for shader instances embedded in other layouts.

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
    <main style={{ minHeight: "100dvh" }}>
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
| `ripple` | `Partial<AsciiRippleSettings>` | enabled, strength 0.35, speed 0.42, wavelength 44, width 70, decay 0.55 |
| `vignette` | `PartialAsciiVignetteSettings` | disabled, radius 20, edge 0.25, all four sides |
| `paused` | `boolean` | `false` |

Values are clamped to `SETTING_LIMITS` via `normalizeAsciiSettings`. The component pauses outside the viewport and on hidden tabs, respects `prefers-reduced-motion`, caps the device pixel ratio at 2, and recovers from WebGL context loss.

With `ripple.enabled`, each click sends a ripple through the field. The component keeps the four most recent ripples. Clicks made while paused or with `prefers-reduced-motion` do not create ripples.

With `vignette.enabled`, glyphs along the screen edges dim toward the edge instead of darkening with a solid gradient. `radius` sets the width of the edge band (% of the shorter screen side), and `edgeLevel` sets how dim the glyphs get at the very edge; the glyphs fade back to full brightness at the inner edge of the band. `sides` (`top`, `right`, `bottom`, `left`) chooses which screen edges the vignette applies to.
