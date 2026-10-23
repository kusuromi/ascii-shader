import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const here = path.dirname(fileURLToPath(import.meta.url));

export default async function globalSetup() {
  await build({
    entryPoints: [path.join(here, "harness.ts")],
    bundle: true,
    format: "iife",
    outfile: path.join(here, ".harness.js"),
    alias: {
      "@kusuromi/ascii-shader-core": path.join(here, "../../core/src/index.ts"),
    },
    logLevel: "silent",
  });
}
