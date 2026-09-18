export type AsciiCursorSettings = {
  enabled: boolean;
  strength: number;
  radius: number;
  follow: number;
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
};

export type AsciiPointerState = {
  currentX: number;
  currentY: number;
  targetX: number;
  targetY: number;
};
