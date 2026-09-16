import { rm } from "node:fs/promises";
import { resolve } from "node:path";

const paths = [
  "node_modules",
  "packages/core/dist",
  "packages/react/dist",
  "apps/demo/dist",
];

await Promise.all(
  paths.map((path) => rm(resolve(path), { recursive: true, force: true })),
);
