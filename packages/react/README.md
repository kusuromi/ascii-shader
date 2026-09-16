# @ascii-background/react

Animated ASCII background for React. The package includes the background component, an optional settings panel, and a localStorage settings hook.

## Install

```bash
npm install @ascii-background/react
```

## Basic usage

```tsx
import { AsciiBackground } from "@ascii-background/react";

export function Hero() {
  return (
    <section style={{ position: "relative", minHeight: "100vh", background: "#000" }}>
      <AsciiBackground style={{ position: "absolute", inset: 0 }} />

      <div style={{ position: "relative", zIndex: 1 }}>
        Your content
      </div>
    </section>
  );
}
```

## With controls

```tsx
import {
  AsciiBackground,
  AsciiControls,
  usePersistentAsciiSettings,
} from "@ascii-background/react";
import "@ascii-background/react/styles.css";

export function Demo() {
  const { settings, setSettings, resetSettings } =
    usePersistentAsciiSettings();

  return (
    <main style={{ minHeight: "100vh", background: "#000" }}>
      <AsciiBackground
        style={{ position: "fixed", inset: 0 }}
        {...settings}
      />

      <AsciiControls
        value={settings}
        onValueChange={setSettings}
        onReset={resetSettings}
      />
    </main>
  );
}
```

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
| `cursor` | `Partial<AsciiCursorSettings>` | enabled |
| `paused` | `boolean` | `false` |

The component uses Canvas 2D, pauses outside the viewport, respects reduced-motion preferences, and limits device pixel ratio internally.
