export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
export const fract = (value: number) => value - Math.floor(value);
export const smoothstep = (value: number) => value * value * (3 - 2 * value);
