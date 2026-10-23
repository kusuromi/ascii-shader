import type { AsciiSettings, AsciiVignetteSides } from "./types";

export type PartialAsciiVignetteSettings = Omit<Partial<AsciiSettings["vignette"]>, "sides"> & {
  sides?: Partial<AsciiVignetteSides>;
};

export type PartialAsciiSettings = Omit<Partial<AsciiSettings>, "cursor" | "ripple" | "vignette"> & {
  cursor?: Partial<AsciiSettings["cursor"]>;
  ripple?: Partial<AsciiSettings["ripple"]>;
  vignette?: PartialAsciiVignetteSettings;
};

export const ASCII_GLYPHS = " .,:;!*oO0&8@";

export const SETTING_LIMITS = {
  cursorStrength: { min: 0, max: 0.8, step: 0.01, digits: 2 },
  cursorRadius: { min: 8, max: 60, step: 1, digits: 0 },
  cursorFollow: { min: 0.02, max: 0.3, step: 0.01, digits: 2 },
  rippleStrength: { min: 0, max: 1, step: 0.01, digits: 2 },
  rippleSpeed: { min: 0.1, max: 1.2, step: 0.01, digits: 2 },
  rippleWavelength: { min: 16, max: 120, step: 1, digits: 0 },
  rippleWidth: { min: 20, max: 200, step: 1, digits: 0 },
  rippleDecay: { min: 0, max: 2, step: 0.05, digits: 2 },
  vignetteRadius: { min: 5, max: 50, step: 1, digits: 0 },
  vignetteEdgeLevel: { min: 0, max: 1, step: 0.01, digits: 2 },
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
  ripple: {
    enabled: true,
    strength: 0.35,
    speed: 0.42,
    wavelength: 44,
    width: 70,
    decay: 0.55,
  },
  vignette: {
    enabled: false,
    radius: 20,
    edgeLevel: 0.25,
    sides: {
      top: true,
      right: true,
      bottom: true,
      left: true,
    },
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
  const ripple = input?.ripple;
  const vignette = input?.vignette;
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
    ripple: {
      enabled: booleanOr(ripple?.enabled, defaults.ripple.enabled),
      strength: clamp(finiteOr(ripple?.strength, defaults.ripple.strength), SETTING_LIMITS.rippleStrength.min, SETTING_LIMITS.rippleStrength.max),
      speed: clamp(finiteOr(ripple?.speed, defaults.ripple.speed), SETTING_LIMITS.rippleSpeed.min, SETTING_LIMITS.rippleSpeed.max),
      wavelength: clamp(finiteOr(ripple?.wavelength, defaults.ripple.wavelength), SETTING_LIMITS.rippleWavelength.min, SETTING_LIMITS.rippleWavelength.max),
      width: clamp(finiteOr(ripple?.width, defaults.ripple.width), SETTING_LIMITS.rippleWidth.min, SETTING_LIMITS.rippleWidth.max),
      decay: clamp(finiteOr(ripple?.decay, defaults.ripple.decay), SETTING_LIMITS.rippleDecay.min, SETTING_LIMITS.rippleDecay.max),
    },
    vignette: {
      enabled: booleanOr(vignette?.enabled, defaults.vignette.enabled),
      radius: clamp(finiteOr(vignette?.radius, defaults.vignette.radius), SETTING_LIMITS.vignetteRadius.min, SETTING_LIMITS.vignetteRadius.max),
      edgeLevel: clamp(finiteOr(vignette?.edgeLevel, defaults.vignette.edgeLevel), SETTING_LIMITS.vignetteEdgeLevel.min, SETTING_LIMITS.vignetteEdgeLevel.max),
      sides: {
        top: booleanOr(vignette?.sides?.top, defaults.vignette.sides.top),
        right: booleanOr(vignette?.sides?.right, defaults.vignette.sides.right),
        bottom: booleanOr(vignette?.sides?.bottom, defaults.vignette.sides.bottom),
        left: booleanOr(vignette?.sides?.left, defaults.vignette.sides.left),
      },
    },
  };
}
