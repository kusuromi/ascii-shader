# ASCII Shader

Monorepo for an animated, interactive ASCII shader rendered with WebGL and its React integration.

## Packages

- [`@ascii-shader/core`](packages/core) — engine host and shared types. Runs the animation loop, handles resize and pointer events, and context recovery.
- [`@ascii-shader/renderer`](packages/renderer) — a two-pass WebGL 1 pipeline. Renders a luminance field pass and a glyph composite pass from a dynamically built glyph atlas.
- [`@ascii-shader/react`](packages/react) — React components. The `<AsciiShader>` component, an optional settings panel, and a persistent settings hook.
- [`apps/demo`](apps/demo) — Vite demo application.

## Development

```bash
npm install
npm run dev
```

## Docker demo

Run the Vite demo in a container (available at http://localhost:8080):

```bash
docker compose up -d --build
```

## Build

```bash
npm run build
```

The package names use the example scope `@ascii-shader`. Change the scope before publishing if needed.