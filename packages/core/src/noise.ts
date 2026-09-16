import { fract, smoothstep } from "./math";

function hash(x: number, y: number) {
  return fract(Math.sin(x * 127.1 + y * 311.7) * 43758.5453123);
}

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
