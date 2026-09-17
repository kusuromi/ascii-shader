import type { AsciiSettings } from "@ascii-background/react";

const VERTEX_SHADER = /* glsl */ `
attribute vec2 aPos;
varying vec2 vUv;

void main() {
  vUv = vec2(aPos.x * 0.5 + 0.5, 0.5 - aPos.y * 0.5);
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

// Pass 1: computes the per-cell luminance field on the GPU, one pixel per cell.
// This is a direct port of the Canvas 2D field loop from @ascii-background/core,
// so both engines produce the same picture.
const FIELD_FRAGMENT_SHADER = /* glsl */ `
precision highp float;

uniform vec2 uResolution;
uniform float uCellSize;
uniform float uTime;
uniform float uFrequency;
uniform float uLightness;
uniform float uContrast;
uniform vec2 uCursor;
uniform float uCursorRadius;
uniform float uCursorStrength;
uniform float uCursorEnabled;

float hash21(vec2 p) {
  // Must match hash() in @ascii-background/core noise.ts.
  // mod 289 keeps lattice coordinates bounded: they grow with time,
  // and float32 loses precision on large inputs.
  p = mod(p, 289.0);
  p = fract(p * vec2(0.3183099, 0.3678794)) + 0.1;
  p += dot(p, p + 19.19);
  return fract(p.x * p.y);
}

float noise2(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 s = f * f * (3.0 - 2.0 * f);

  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  float top = a + (b - a) * s.x;
  float bottom = c + (d - c) * s.x;

  return top + (bottom - top) * s.y;
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.55;
  float frequency = 1.0;

  for (int octave = 0; octave < 4; octave += 1) {
    value += amplitude * noise2(p * frequency);
    frequency *= 2.05;
    amplitude *= 0.5;
  }

  return value;
}

void main() {
  // gl_FragCoord is the cell center, matching u = (column + 0.5) * cell / width.
  vec2 uv = gl_FragCoord.xy * uCellSize / uResolution;

  vec2 cursorDelta = (uv - uCursor) * uResolution;
  float cursorGlow = uCursorEnabled * exp(-dot(cursorDelta, cursorDelta) / (uCursorRadius * uCursorRadius));

  float waveA = fbm(vec2(uv.x * uFrequency * 2.8 + uTime * 0.42, uv.y * uFrequency * 1.8 - uTime * 0.34));
  float waveB = fbm(vec2(uv.x * uFrequency * 5.2 - uTime * 0.2, uv.y * uFrequency * 3.4 + uTime * 0.26));
  float sweep = sin((uv.x * 2.2 - uv.y * 1.5 + uTime * 0.18) * 6.28318530718) * 0.5 + 0.5;

  float luminance = waveA * 0.58 + waveB * 0.31 + sweep * 0.11 + cursorGlow * uCursorStrength;
  luminance = pow(clamp(luminance * uLightness - 0.09, 0.0, 1.0), uContrast);

  gl_FragColor = vec4(luminance, 0.0, 0.0, 1.0);
}
`;

// Pass 2: samples the field texture and draws the glyph for each cell.
const COMPOSITE_FRAGMENT_SHADER = /* glsl */ `
precision highp float;

varying vec2 vUv;

uniform vec2 uGridSize;
uniform float uGlyphCount;
uniform float uOpacity;
uniform sampler2D uField;
uniform sampler2D uGlyphAtlas;
uniform float uAtlasCols;
uniform float uInsetBase;
uniform float uInsetScale;

void main() {
  vec2 cellPos = vUv * uGridSize;
  vec2 cellIndex = floor(cellPos);
  vec2 pLocal = fract(cellPos);

  vec2 fieldUv = (cellIndex + 0.5) / uGridSize;
  float luminance = texture2D(uField, fieldUv).r;

  int id = int(floor(min(luminance * uGlyphCount, uGlyphCount - 0.001)));

  float colorIndex = min(floor(luminance * 128.0), 127.0);
  float stepLuminance = colorIndex / 127.0;
  float shade = floor(188.0 + stepLuminance * 58.0);
  float alpha = clamp(stepLuminance * uOpacity, 0.04, 0.92);
  alpha = floor(alpha * 100.0 + 0.5) / 100.0;

  vec2 inset = vec2(
    uInsetBase + pLocal.x * uInsetScale,
    uInsetBase + pLocal.y * uInsetScale
  );
  float cover = texture2D(uGlyphAtlas, vec2((float(id) + inset.x) / uAtlasCols, inset.y)).a;

  alpha = luminance < 0.035 ? 0.0 : alpha * cover;

  gl_FragColor = vec4(vec3(shade / 255.0), alpha);
}
`;

const ATLAS_COLS = 16;
const ATLAS_FONT = (cellSize: number, dpr: number) =>
  `700 ${Math.max(10, cellSize * 0.94) * dpr}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`;

export type AsciiShaderFrame = {
  width: number;
  height: number;
  time: number;
  dpr: number;
  settings: AsciiSettings;
  pointer: { currentX: number; currentY: number };
};

function compileShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Unable to create shader");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Shader compilation failed: ${log}`);
  }
  return shader;
}

function linkProgram(gl: WebGLRenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader) {
  const program = gl.createProgram();
  if (!program) throw new Error("Unable to create program");
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program);
    throw new Error(`Program link failed: ${log}`);
  }
  return program;
}

function getUniforms(gl: WebGLRenderingContext, program: WebGLProgram, names: readonly string[]) {
  const locations: Record<string, WebGLUniformLocation> = {};
  for (const name of names) {
    const location = gl.getUniformLocation(program, name);
    if (location === null) throw new Error(`Uniform not found: ${name}`);
    locations[name] = location;
  }
  return locations;
}

function buildGlyphAtlas(
  gl: WebGLRenderingContext,
  chars: string,
  cellSize: number,
  dpr: number,
) {
  const cellPixels = Math.max(1, Math.ceil(cellSize * dpr));
  const fontSize = Math.max(10, cellSize * 0.94) * dpr;
  const margin = Math.ceil(fontSize * 0.5) + 2;
  const box = cellPixels + margin * 2;
  const canvas = document.createElement("canvas");
  canvas.width = ATLAS_COLS * box;
  canvas.height = box;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Unable to create atlas context");

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#fff";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = ATLAS_FONT(cellSize, dpr);

  for (let index = 0; index < chars.length; index += 1) {
    const x = index * box + box / 2;
    const y = box / 2;
    context.fillText(chars[index], x, y);

    const tile = context.getImageData(index * box, 0, box, box).data;
    let inkTop = -1;
    let inkBottom = -1;
    for (let row = 0; row < box; row += 1) {
      for (let col = 0; col < box; col += 1) {
        if (tile[(row * box + col) * 4 + 3] > 20) {
          if (inkTop === -1) inkTop = row;
          inkBottom = row;
        }
      }
    }
    if (inkTop === -1) continue;

    const inkCenter = (inkTop + inkBottom + 1) / 2;
    const shift = Math.round(box / 2 - inkCenter);
    if (shift !== 0) {
      context.clearRect(index * box, 0, box, box);
      context.fillText(chars[index], x, y + shift);
    }
  }

  const texture = gl.createTexture();
  if (!texture) throw new Error("Unable to create atlas texture");
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  return {
    texture,
    insetBase: margin / box,
    insetScale: cellPixels / box,
  };
}

export function createAsciiShaderRenderer(gl: WebGLRenderingContext) {
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fieldFragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, FIELD_FRAGMENT_SHADER);
  const compositeFragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, COMPOSITE_FRAGMENT_SHADER);

  const fieldProgram = linkProgram(gl, vertexShader, fieldFragmentShader);
  const compositeProgram = linkProgram(gl, vertexShader, compositeFragmentShader);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 3, -1, -1, 3]),
    gl.STATIC_DRAW,
  );

  const fieldPosition = gl.getAttribLocation(fieldProgram, "aPos");
  const compositePosition = gl.getAttribLocation(compositeProgram, "aPos");
  const bindQuad = (location: number) => {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(location, 2, gl.FLOAT, false, 0, 0);
  };

  const fieldUniforms = getUniforms(gl, fieldProgram, [
    "uResolution",
    "uCellSize",
    "uTime",
    "uFrequency",
    "uLightness",
    "uContrast",
    "uCursor",
    "uCursorRadius",
    "uCursorStrength",
    "uCursorEnabled",
  ] as const);
  const compositeUniforms = getUniforms(gl, compositeProgram, [
    "uGridSize",
    "uGlyphCount",
    "uOpacity",
    "uField",
    "uGlyphAtlas",
    "uAtlasCols",
    "uInsetBase",
    "uInsetScale",
  ] as const);

  gl.useProgram(compositeProgram);
  gl.uniform1i(compositeUniforms.uField, 1);
  gl.uniform1i(compositeUniforms.uGlyphAtlas, 0);
  gl.uniform1f(compositeUniforms.uAtlasCols, ATLAS_COLS);

  gl.disable(gl.DEPTH_TEST);

  let atlasTexture: WebGLTexture | null = null;
  let currentInsetBase = 0;
  let currentInsetScale = 0;
  let currentAtlasKey = "";

  const framebuffer = gl.createFramebuffer();
  let fieldTexture: WebGLTexture | null = null;
  let fieldWidth = 0;
  let fieldHeight = 0;

  const ensureField = (columns: number, rows: number) => {
    if (fieldTexture === null) {
      fieldTexture = gl.createTexture();
      if (!fieldTexture) throw new Error("Unable to create field texture");
      gl.bindTexture(gl.TEXTURE_2D, fieldTexture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
      gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        fieldTexture,
        0,
      );
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    if (columns !== fieldWidth || rows !== fieldHeight) {
      fieldWidth = columns;
      fieldHeight = rows;
      gl.bindTexture(gl.TEXTURE_2D, fieldTexture);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        columns,
        rows,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        null,
      );

      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
      const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      if (status !== gl.FRAMEBUFFER_COMPLETE) {
        throw new Error(`Field framebuffer incomplete: ${status}`);
      }
    }
  };

  return {
    render(frame: AsciiShaderFrame) {
      const { width, height, dpr, time, settings, pointer } = frame;
      const chars = settings.glyphs.slice(-Math.round(settings.glyphCount));

      const atlasKey = `${chars}|${settings.cellSize}|${dpr}`;
      if (atlasKey !== currentAtlasKey && chars.length > 0) {
        if (atlasTexture) gl.deleteTexture(atlasTexture);
        const atlas = buildGlyphAtlas(gl, chars, settings.cellSize, dpr);
        atlasTexture = atlas.texture;
        currentInsetBase = atlas.insetBase;
        currentInsetScale = atlas.insetScale;
        currentAtlasKey = atlasKey;
      }

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);

      if (!atlasTexture || chars.length === 0) return;

      const columns = Math.ceil(width / settings.cellSize);
      const rows = Math.ceil(height / settings.cellSize);
      ensureField(columns, rows);

      // Pass 1: luminance field, one pixel per cell.
      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
      gl.viewport(0, 0, columns, rows);
      gl.useProgram(fieldProgram);
      bindQuad(fieldPosition);
      gl.disable(gl.BLEND);
      gl.uniform2f(fieldUniforms.uResolution, width, height);
      gl.uniform1f(fieldUniforms.uCellSize, settings.cellSize);
      gl.uniform1f(fieldUniforms.uTime, time);
      gl.uniform1f(fieldUniforms.uFrequency, settings.frequency);
      gl.uniform1f(fieldUniforms.uLightness, settings.lightness);
      gl.uniform1f(fieldUniforms.uContrast, settings.contrast);
      gl.uniform2f(fieldUniforms.uCursor, pointer.currentX, pointer.currentY);
      gl.uniform1f(
        fieldUniforms.uCursorRadius,
        (settings.cursor.radius / 100) * Math.min(width, height),
      );
      gl.uniform1f(fieldUniforms.uCursorStrength, settings.cursor.strength);
      gl.uniform1f(fieldUniforms.uCursorEnabled, settings.cursor.enabled ? 1 : 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      // Pass 2: glyph composite to the canvas.
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      gl.useProgram(compositeProgram);
      bindQuad(compositePosition);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, fieldTexture);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, atlasTexture);

      gl.uniform2f(compositeUniforms.uGridSize, columns, rows);
      gl.uniform1f(compositeUniforms.uGlyphCount, chars.length);
      gl.uniform1f(compositeUniforms.uOpacity, settings.opacity);
      gl.uniform1f(compositeUniforms.uInsetBase, currentInsetBase);
      gl.uniform1f(compositeUniforms.uInsetScale, currentInsetScale);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },

    debug() {
      if (!fieldTexture || fieldWidth === 0 || fieldHeight === 0) {
        return { columns: fieldWidth, rows: fieldHeight, sample: null as number[] | null };
      }
      const pixels = new Uint8Array(fieldWidth * fieldHeight * 4);
      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
      gl.readPixels(0, 0, fieldWidth, fieldHeight, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      const sample = new Array<number>(fieldWidth * fieldHeight);
      for (let i = 0; i < sample.length; i += 1) {
        sample[i] = pixels[i * 4] / 255;
      }
      return { columns: fieldWidth, rows: fieldHeight, sample };
    },

    dispose() {
      if (atlasTexture) gl.deleteTexture(atlasTexture);
      if (fieldTexture) gl.deleteTexture(fieldTexture);
      gl.deleteFramebuffer(framebuffer);
      gl.deleteProgram(fieldProgram);
      gl.deleteProgram(compositeProgram);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fieldFragmentShader);
      gl.deleteShader(compositeFragmentShader);
      gl.deleteBuffer(buffer);
    },
  };
}
