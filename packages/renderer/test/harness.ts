import { normalizeAsciiSettings, serializeAsciiSettings, type PartialAsciiSettings } from "@kusuromi/ascii-shader-core";
import { createAsciiShaderRenderer } from "../src/renderer";

const WIDTH = 780;
const HEIGHT = 520;

const canvas = document.createElement("canvas");
canvas.width = WIDTH;
canvas.height = HEIGHT;
document.body.appendChild(canvas);

const gl = canvas.getContext("webgl2");
if (!gl) throw new Error("WebGL2 unavailable");
const renderer = createAsciiShaderRenderer(gl);

type FieldPointer = { currentX: number; currentY: number };

declare global {
  interface Window {
    renderField: (settings: PartialAsciiSettings, pointer?: FieldPointer) => {
      columns: number;
      rows: number;
      sample: number[];
    };
    serializeRoundTrip: (settings: PartialAsciiSettings) => {
      changes: unknown;
      restored: unknown;
      expected: unknown;
    };
  }
}

window.renderField = (partial, pointer = { currentX: 0.5, currentY: 0.5 }) => {
  renderer.render({
    width: WIDTH,
    height: HEIGHT,
    dpr: 1,
    time: 1,
    settings: normalizeAsciiSettings(partial),
    pointer,
  });
  const field = renderer.debug();
  return { columns: field.columns, rows: field.rows, sample: field.sample ?? [] };
};

window.serializeRoundTrip = (partial) => {
  const settings = normalizeAsciiSettings(partial);
  const changes = serializeAsciiSettings(settings);
  return {
    changes,
    restored: normalizeAsciiSettings(changes),
    expected: settings,
  };
};
