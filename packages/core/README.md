# @ascii-background/core

Canvas 2D renderer for an animated ASCII background. It contains the noise field, glyph mapping, settings normalization, and frame renderer without React or UI dependencies.

## Install

```bash
npm install @ascii-background/core
```

## Usage

```ts
import {
  createAsciiRenderer,
  DEFAULT_ASCII_SETTINGS,
} from "@ascii-background/core";

const renderer = createAsciiRenderer();

renderer.render({
  context,
  dimensions: { width, height },
  time,
  settings: DEFAULT_ASCII_SETTINGS,
  pointer: {
    currentX: 0.5,
    currentY: 0.5,
    targetX: 0.5,
    targetY: 0.5,
  },
});
```

Use `@ascii-background/react` when you need a ready React component.
