import { isStr } from "..";

// ============ Timer Helpers ============

export { setTimeout, setInterval, requestAnimationFrame } from "sia-reactor/utils";

// ============ Limited Call Helpers ============

export interface LimitedOptions {
  key?: string /** Key for localStorage persistence (if omitted, uses session-only) */;
  maxTimes?: number /** Max times to call (default: 1) */;
}
export interface LimitedHandle<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): ReturnType<T> | void;
  count: number;
  left: number;
  reset: () => void;
  block: () => void;
}

export function limited<T extends (...args: any[]) => any>(FN_KEY: string, fn: T, opts: LimitedOptions | string = {}): LimitedHandle<T> {
  let count = 0,
    { key, maxTimes: max = 1 } = isStr(opts) ? { key: opts } : opts;
  const getReg = () => JSON.parse(localStorage.getItem(FN_KEY) || "{}"),
    setReg = (r: Record<string, number>) => localStorage.setItem(FN_KEY, JSON.stringify(r));
  const handle = (...args: Parameters<T>): ReturnType<T> | void => {
    if (!key) return count++ < max ? fn(...args) : undefined;
    const r = getReg(),
      c = r[key] || 0;
    return c < max ? ((r[key] = c + 1), setReg(r), fn(...args)) : undefined;
  };
  handle.left = max - (handle.count = count);
  handle.reset = () => ((count = 0), key && ((r) => (delete r[key], setReg(r)))(getReg()));
  handle.block = () => ((count = max), key && ((r) => ((r[key] = max), setReg(r)))(getReg()));
  return handle;
} // Locally limited fn calls, make a closure with FN_KEY for ease of use

// ============ Async Helpers ============

export const mockAsync = (timeout = 250): Promise<void> => new Promise((resolve) => setTimeout(resolve, timeout));

export const breath = (w = window) => new Promise((res) => w.requestAnimationFrame(res)); // The "Single Frame" breathe - GPU Readiness, the loading animation is the build process itself. Sike!!

export const deepBreath = (w = window) => new Promise((res) => w.requestAnimationFrame(() => w.requestAnimationFrame(res))); // The "Double Frame" breathe - guaranteed layout completion

// ============ Generic Helpers ============

export function bindCleanupToSignal<Cb extends () => any>(cleanup: Cb, signal?: AbortSignal): Cb {
  signal?.aborted ? cleanup() : signal?.addEventListener("abort", cleanup, { once: true });
  if (signal && !signal.aborted) cleanup = (() => (signal.removeEventListener("abort", cleanup), cleanup())) as Cb;
  return cleanup; // once incase spec changes, memory leaks too
} // for simple one-way cleanup functions without off logic elsewhere
