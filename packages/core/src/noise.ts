import { fract, smoothstep } from "./math";

function hash(x: number, y: number) {
  // Float32-friendly hash: the WebGL port runs the same formula in mediump/highp
  // float32, so avoid sin()-based hashing (its precision loss gets amplified by
  // the 43758x multiplier and decorrelates from the float64 result).
  // Lattice coordinates are bounded with mod 289 because they grow with time.
  // Note: GLSL mod() is always non-negative, unlike the JS % operator,
  // and lattice coordinates can be negative (noise inputs include -time terms).
  let px = fract(glslMod(x, 289) * 0.3183099) + 0.1;
  let py = fract(glslMod(y, 289) * 0.3678794) + 0.1;
  const dot = px * (px + 19.19) + py * (py + 19.19);
  px += dot;
  py += dot;
  return fract(px * py);
}

const glslMod = (value: number, divisor: number) => ((value % divisor) + divisor) % divisor;

export function noise(x: number, y: number) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = smoothstep(fract(x));
  const fy = smoothstep(fract(y));

  const a = hash(ix, iy);
  const b = hash(ix + 1, iy);
  const c = hash(ix, iy + 1);
  const d = hash(ix + 1, iy + 1);
  const top = a + (b - a) * fx;
  const bottom = c + (d - c) * fx;

  return top + (bottom - top) * fy;
}

export function fbm(x: number, y: number) {
  let value = 0;
  let amplitude = 0.55;
  let frequency = 1;

  for (let octave = 0; octave < 4; octave += 1) {
    value += amplitude * noise(x * frequency, y * frequency);
    frequency *= 2.05;
    amplitude *= 0.5;
  }

  return value;
}
