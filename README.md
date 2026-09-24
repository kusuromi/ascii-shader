# ASCII Shader

Monorepo for an animated, interactive ASCII shader rendered with WebGL and its React integration.

## Packages

- [`@kusuromi/ascii-shader-core`](packages/core) — engine host with animation loop, resize and pointer handling.
- [`@kusuromi/ascii-shader-renderer`](packages/renderer) — two-pass WebGL 1 pipeline with luminance and glyph passes.
- [`@kusuromi/ascii-shader-react`](packages/react) — React component with optional controls and persistent settings.
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

The packages are published under the `@kusuromi` npm scope.
