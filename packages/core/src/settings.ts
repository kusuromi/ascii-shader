import type { AsciiSettings } from "./types";

export type PartialAsciiSettings = Omit<Partial<AsciiSettings>, "cursor"> & {
  cursor?: Partial<AsciiSettings["cursor"]>;
};

export const ASCII_GLYPHS = " .,:;!*oO0&8@";

export const SETTING_LIMITS = {
  cursorStrength: { min: 0, max: 0.8, step: 0.01, digits: 2 },
  cursorRadius: { min: 8, max: 60, step: 1, digits: 0 },
  cursorFollow: { min: 0.02, max: 0.3, step: 0.01, digits: 2 },
  frequency: { min: 0.8, max: 4.5, step: 0.1, digits: 1 },
  speed: { min: 0.1, max: 2.4, step: 0.05, digits: 2 },
  lightness: { min: 0.25, max: 1.35, step: 0.01, digits: 2 },
  contrast: { min: 0.65, max: 2.25, step: 0.01, digits: 2 },
  opacity: { min: 0.25, max: 1, step: 0.01, digits: 2 },
  cellSize: { min: 9, max: 22, step: 1, digits: 0 },
  glyphCount: { min: 4, max: 12, step: 1, digits: 0 },
} as const;

export const DEFAULT_ASCII_SETTINGS: AsciiSettings = {
  glyphs: ASCII_GLYPHS,
  glyphCount: 10,
  cellSize: 13,
  frequency: 2.4,
  speed: 0.85,
  lightness: 0.92,
  contrast: 1.24,
  opacity: 0.82,
  cursor: {
    enabled: true,
    strength: 0.34,
    radius: 24,
    follow: 0.06,
  },
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const finiteOr = (value: unknown, fallback: number) =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const booleanOr = (value: unknown, fallback: boolean) =>
  typeof value === "boolean" ? value : fallback;

export function normalizeAsciiSettings(input?: PartialAsciiSettings | null): AsciiSettings {
  const defaults = DEFAULT_ASCII_SETTINGS;
  const cursor = input?.cursor;
  const glyphs = typeof input?.glyphs === "string" && input.glyphs.length > 0 ? input.glyphs : defaults.glyphs;

  return {
    glyphs,
    glyphCount: clamp(
      finiteOr(input?.glyphCount, defaults.glyphCount),
      1,
      Math.min(SETTING_LIMITS.glyphCount.max, glyphs.length),
    ),
    cellSize: clamp(finiteOr(input?.cellSize, defaults.cellSize), SETTING_LIMITS.cellSize.min, SETTING_LIMITS.cellSize.max),
    frequency: clamp(finiteOr(input?.frequency, defaults.frequency), SETTING_LIMITS.frequency.min, SETTING_LIMITS.frequency.max),
    speed: clamp(finiteOr(input?.speed, defaults.speed), SETTING_LIMITS.speed.min, SETTING_LIMITS.speed.max),
    lightness: clamp(finiteOr(input?.lightness, defaults.lightness), SETTING_LIMITS.lightness.min, SETTING_LIMITS.lightness.max),
    contrast: clamp(finiteOr(input?.contrast, defaults.contrast), SETTING_LIMITS.contrast.min, SETTING_LIMITS.contrast.max),
    opacity: clamp(finiteOr(input?.opacity, defaults.opacity), SETTING_LIMITS.opacity.min, SETTING_LIMITS.opacity.max),
    cursor: {
      enabled: booleanOr(cursor?.enabled, defaults.cursor.enabled),
      strength: clamp(finiteOr(cursor?.strength, defaults.cursor.strength), SETTING_LIMITS.cursorStrength.min, SETTING_LIMITS.cursorStrength.max),
      radius: clamp(finiteOr(cursor?.radius, defaults.cursor.radius), SETTING_LIMITS.cursorRadius.min, SETTING_LIMITS.cursorRadius.max),
      follow: clamp(finiteOr(cursor?.follow, defaults.cursor.follow), SETTING_LIMITS.cursorFollow.min, SETTING_LIMITS.cursorFollow.max),
    },
  };
}
