# ASCII Background

Monorepo for an animated ASCII background renderer and its React integration.

## Packages

- [`@ascii-background/core`](packages/core) — framework-independent Canvas 2D renderer.
- [`@ascii-background/react`](packages/react) — React component, optional settings panel, and persistent settings hook.
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

The package names use the example scope `@ascii-background`. Change the scope before publishing if needed.
