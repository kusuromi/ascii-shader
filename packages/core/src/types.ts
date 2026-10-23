export type AsciiCursorSettings = {
  enabled: boolean;
  strength: number;
  radius: number;
  follow: number;
};

export type AsciiRippleSettings = {
  enabled: boolean;
  strength: number;
  /** Front speed as a fraction of the shorter screen side per second. */
  speed: number;
  /** Distance between wave crests, in CSS px. */
  wavelength: number;
  /** Width of the ring band, in CSS px. */
  width: number;
  /** Exponential fade rate per second. */
  decay: number;
};

export type AsciiVignetteSides = {
  top: boolean;
  right: boolean;
  bottom: boolean;
  left: boolean;
};

export type AsciiVignetteSettings = {
  enabled: boolean;
  /** Width of the band along each enabled screen edge, as a percentage of the shorter screen side. */
  radius: number;
  /** Glyph level at the very edge of the band, relative to the field (0..1). It rises to 1 at the inner edge. */
  edgeLevel: number;
  /** Screen edges the vignette applies to. */
  sides: AsciiVignetteSides;
};

export type AsciiSettings = {
  glyphs: string;
  glyphCount: number;
  cellSize: number;
  frequency: number;
  speed: number;
  lightness: number;
  contrast: number;
  opacity: number;
  cursor: AsciiCursorSettings;
  ripple: AsciiRippleSettings;
  vignette: AsciiVignetteSettings;
};

export type AsciiRipple = {
  /** Click position in 0..1 element space. */
  x: number;
  y: number;
  /** Start time on the shader clock, in seconds. */
  startTime: number;
};

export type AsciiPointerState = {
  currentX: number;
  currentY: number;
  targetX: number;
  targetY: number;
};
