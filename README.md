# ASCII Shader

Monorepo for an animated, interactive ASCII shader rendered with WebGL and its React integration.

## Packages

- [`@ascii-shader/core`](packages/core) — engine host (animation loop, resize, pointer, context recovery), settings normalization, and shared types.
- [`@ascii-shader/renderer`](packages/renderer) — the renderer: a two-pass WebGL 1 pipeline (luminance field pass → glyph composite pass) with a dynamically built glyph atlas.
- [`@ascii-shader/react`](packages/react) — React component `<AsciiShader>`, optional settings panel, and persistent settings hook.
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