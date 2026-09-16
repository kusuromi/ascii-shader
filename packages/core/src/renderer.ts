import { clamp } from "./math";
import { fbm } from "./noise";
import type { AsciiRenderFrame } from "./types";

const GRADIENT_STEPS = 128;

function buildPalette(opacity: number): string[] {
  const palette = new Array<string>(GRADIENT_STEPS);
  for (let step = 0; step < GRADIENT_STEPS; step += 1) {
    const luminance = step / (GRADIENT_STEPS - 1);
    const shade = Math.floor(188 + luminance * 58);
    const alpha = clamp(luminance * opacity, 0.04, 0.92);
    palette[step] = `rgba(${shade}, ${shade}, ${shade}, ${alpha.toFixed(2)})`;
  }
  return palette;
}

type GridCache = {
  key: string;
  x: Float32Array;
  u: Float32Array;
  y: Float32Array;
  v: Float32Array;
};

export function createAsciiRenderer() {
  let gridCache: GridCache | null = null;
  let palette: string[] | null = null;
  let paletteOpacity = -1;
  let glyphCacheKey = "";
  let glyphCacheCount = 0;
  let glyphCacheValue = "";

  const getGrid = (width: number, height: number, cellSize: number) => {
    const columns = Math.ceil(width / cellSize);
    const rows = Math.ceil(height / cellSize);
    const key = `${width}:${height}:${cellSize}`;

    if (gridCache?.key === key) return gridCache;

    const x = new Float32Array(columns);
    const u = new Float32Array(columns);
    const y = new Float32Array(rows);
    const v = new Float32Array(rows);

    for (let column = 0; column < columns; column += 1) {
      x[column] = column * cellSize + cellSize * 0.5;
      u[column] = x[column] / width;
    }

    for (let row = 0; row < rows; row += 1) {
      y[row] = row * cellSize + cellSize * 0.5;
      v[row] = y[row] / height;
    }

    gridCache = { key, x, u, y, v };
    return gridCache;
  };

  const getPalette = (opacity: number) => {
    if (palette === null || paletteOpacity !== opacity) {
      palette = buildPalette(opacity);
      paletteOpacity = opacity;
    }
    return palette;
  };

  const getGlyphs = (glyphs: string, count: number) => {
    if (glyphCacheKey !== glyphs || glyphCacheCount !== count) {
      glyphCacheKey = glyphs;
      glyphCacheCount = count;
      glyphCacheValue = glyphs.slice(-Math.round(count));
    }
    return glyphCacheValue;
  };

  const render = ({ context, dimensions, time, settings, pointer }: AsciiRenderFrame) => {
    const { width, height } = dimensions;
    const cell = settings.cellSize;
    const grid = getGrid(width, height, cell);
    const chars = getGlyphs(settings.glyphs, settings.glyphCount);
    const colors = getPalette(settings.opacity);
    const cursorRadiusPixels = (settings.cursor.radius / 100) * Math.min(width, height);

    context.fillStyle = "#000";
    context.fillRect(0, 0, width, height);
    context.font = `700 ${Math.max(10, cell * 0.94)}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`;
    context.textAlign = "center";
    context.textBaseline = "middle";

    if (chars.length === 0) return;

    const lastCharIndex = chars.length - 1;
    let currentStyle = "";

    for (let row = 0; row < grid.y.length; row += 1) {
      const y = grid.y[row];
      const v = grid.v[row];

      for (let column = 0; column < grid.x.length; column += 1) {
        const x = grid.x[column];
        const u = grid.u[column];
        const dx = (u - pointer.currentX) * width;
        const dy = (v - pointer.currentY) * height;
        const cursorGlow = settings.cursor.enabled
          ? Math.exp(-(dx * dx + dy * dy) / (cursorRadiusPixels * cursorRadiusPixels))
          : 0;

        const waveA = fbm(
          u * settings.frequency * 2.8 + time * 0.42,
          v * settings.frequency * 1.8 - time * 0.34,
        );
        const waveB = fbm(
          u * settings.frequency * 5.2 - time * 0.2,
          v * settings.frequency * 3.4 + time * 0.26,
        );
        const sweep = Math.sin((u * 2.2 - v * 1.5 + time * 0.18) * Math.PI * 2) * 0.5 + 0.5;
        let luminance = waveA * 0.58 + waveB * 0.31 + sweep * 0.11 + cursorGlow * settings.cursor.strength;

        luminance = Math.pow(clamp(luminance * settings.lightness - 0.09, 0, 1), settings.contrast);

        if (luminance < 0.035) continue;

        const style = colors[Math.min(colors.length - 1, Math.floor(luminance * colors.length))];
        if (style !== currentStyle) {
          currentStyle = style;
          context.fillStyle = style;
        }

        context.fillText(chars[Math.min(lastCharIndex, Math.floor(luminance * chars.length))], x, y);
      }
    }
  };

  return { render };
}