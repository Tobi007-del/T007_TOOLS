import { isStr } from "./obj";

// Generation
export function uid(prefix = ""): string {
  return prefix + Date.now().toString(36) + "_" + performance.now().toString(36).replace(".", "") + "_" + Math.random().toString(36).slice(2);
}

// Checkers
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
