// Validators
export function clamp(min = 0, val: number, max = Infinity) {
  return Math.min(Math.max(val, min), max);
}