import { DEFAULT_ASCII_SETTINGS, type PartialAsciiSettings } from "./settings";
import type { AsciiSettings } from "./types";

type Plain = Record<string, unknown>;

const isPlainObject = (value: unknown): value is Plain =>
  typeof value === "object" && value !== null && !Array.isArray(value);

// Slider steps are at most two decimals; four digits removes float noise without changing any setting.
const roundNumber = (value: number) => Math.round(value * 10000) / 10000;

function diffAgainst(defaults: Plain, value: Plain): Plain {
  const changes: Plain = {};
  for (const key of Object.keys(value)) {
    const current = value[key];
    const fallback = defaults[key];
    if (isPlainObject(current) && isPlainObject(fallback)) {
      const nested = diffAgainst(fallback, current);
      if (Object.keys(nested).length > 0) changes[key] = nested;
      continue;
    }
    const rounded = typeof current === "number" ? roundNumber(current) : current;
    if (rounded !== fallback) changes[key] = rounded;
  }
  return changes;
}

/** Returns only the settings that differ from the defaults, rounded for copying into code. */
export function serializeAsciiSettings(settings: AsciiSettings): PartialAsciiSettings {
  return diffAgainst(DEFAULT_ASCII_SETTINGS as unknown as Plain, settings as unknown as Plain) as PartialAsciiSettings;
}
