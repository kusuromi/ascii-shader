import type { PartialAsciiSettings } from "@kusuromi/ascii-shader-core";

type Plain = Record<string, unknown>;

const isPlainObject = (value: unknown): value is Plain =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function formatValue(value: unknown): string {
  if (typeof value === "string") return JSON.stringify(value);
  if (isPlainObject(value)) {
    const entries = Object.entries(value).map(([key, nested]) => `${key}: ${formatValue(nested)}`);
    return `{ ${entries.join(", ")} }`;
  }
  return String(value);
}

export function formatReactSnippet(settings: PartialAsciiSettings): string {
  const props = Object.entries(settings as Plain).map(([key, value]) => `      ${key}={${formatValue(value)}}`);
  const element =
    props.length === 0
      ? "    <AsciiShaderBackground />"
      : ["    <AsciiShaderBackground", ...props, "    />"].join("\n");

  return [
    '"use client";',
    "",
    'import { AsciiShaderBackground } from "@kusuromi/ascii-shader-react";',
    'import "@kusuromi/ascii-shader-react/styles.css";',
    "",
    "export function AsciiBackground() {",
    "  return (",
    element,
    "  );",
    "}",
    "",
  ].join("\n");
}

export function formatJsonSnippet(settings: PartialAsciiSettings): string {
  return `${JSON.stringify(settings, null, 2)}\n`;
}
