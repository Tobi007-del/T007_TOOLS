import { isStr } from "..";

// Generation

/** Create a short unique string with an optional prefix.
 * @param prefix Prefix added to the generated id.
 * @returns A browser-safe unique id string.
 */
export function uid(prefix = ""): string {
  return prefix + Date.now().toString(36) + "_" + performance.now().toString(36).replace(".", "") + "_" + Math.random().toString(36).slice(2);
}

// Converters

/** Convert a rem value to pixels based on the font size of a given element.
 * @param rem The rem value to convert.
 * @param el The element to use for font size reference. Defaults to the root element.
 * @returns The equivalent pixel value.
 */
export function remToPx(rem: number, el: HTMLElement = document.documentElement): number {
  return rem * parseFloat(getComputedStyle(el).fontSize);
}

/** Convert a pixel value to rem based on the font size of a given element.
 * @param px The pixel value to convert.
 * @param el The element to use for font size reference. Defaults to the root element.
 * @returns The equivalent rem value.
 */
export function pxToRem(px: number, el: HTMLElement = document.documentElement): number {
  return px / parseFloat(getComputedStyle(el).fontSize);
}

// Parsers

/** Parse a CSS time value (e.g. "200ms", "0.5s") into milliseconds.
 * @param time The CSS time string to parse.
 * @returns The equivalent time in milliseconds.
 */
export function parseCSSTime(time: any): number {
  return time?.endsWith?.("ms") ? parseFloat(time) : parseFloat(time) * 1000;
}

/** Parse a CSS size value (i.e. "16px" or "1.5rem") into pixels.
 * @param size The CSS size string to parse.
 * @param el The element to use for rem reference if needed. Defaults to the root element.
 * @returns The equivalent value in pixels.
 */
export function parseCSSSize(size: any, el?: HTMLElement): number {
  return size?.endsWith?.("px") ? parseFloat(size) : remToPx(parseFloat(size), el);
}

// Checkers

/** Compare two URLs after normalizing origin, pathname, and separators.
 * @param src1 First URL or path.
 * @param src2 Second URL or path.
 * @returns True when both references point to the same resource.
 */
export function isSameURL(src1: unknown, src2: unknown): boolean {
  if (!isStr(src1) || !isStr(src2) || !src1 || !src2) return false;
  try {
    const u1 = new URL(src1, window.location.href),
      u2 = new URL(src2, window.location.href);
    return decodeURIComponent(u1.origin + u1.pathname) === decodeURIComponent(u2.origin + u2.pathname);
  } catch {
    return src1.replace(/\\/g, "/").split("?")[0].trim() === src2.replace(/\\/g, "/").split("?")[0].trim();
  }
}
