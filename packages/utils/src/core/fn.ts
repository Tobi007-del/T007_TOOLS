import { isStr } from "..";

// ============ Timer Helpers ============

export { setTimeout, setInterval, requestAnimationFrame } from "sia-reactor/utils";

// ============ Limited Call Helpers ============

export interface LimitedOptions {
  /** Storage key used to persist call counts. */
  key?: string;
  /** Maximum number of allowed calls. */
  maxTimes?: number;
}
export interface LimitedHandle<T extends (...args: any[]) => any> {
  /** Call the wrapped function with the original arguments. */
  (...args: Parameters<T>): ReturnType<T> | void;
  /** Number of calls already consumed in the current session. */
  count: number;
  /** Number of calls left before the limit is reached. */
  left: number;
  /** Reset the call counter. */
  reset: () => void;
  /** Consume the full allowance and block further calls. */
  block: () => void;
}

/** Limit how many times a function may run.
 * @param FN_KEY Storage namespace used to persist the counter.
 * @param fn Function to wrap.
 * @param opts Call limit settings or a storage key string.
 * @returns Wrapped function with count, reset, and block helpers.
 */
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

/** Resolve on the next task tick.
 * @param timeout Delay in milliseconds.
 * @returns Promise that resolves after the timeout.
 */
export const mockAsync = (timeout = 250): Promise<void> => new Promise((resolve) => setTimeout(resolve, timeout));

/** Resolve on the next animation frame.
 * @param w Window-like object used for scheduling.
 * @returns Promise that resolves on the next frame.
 */
export const breath = (w = window) => new Promise((res) => w.requestAnimationFrame(res)); // The "Single Frame" breathe - GPU Readiness, the loading animation is the build process itself. Sike!!

/** Resolve after two animation frames.
 * @param w Window-like object used for scheduling.
 * @returns Promise that resolves after layout has had two frames to settle.
 */
export const deepBreath = (w = window) => new Promise((res) => w.requestAnimationFrame(() => w.requestAnimationFrame(res))); // The "Double Frame" breathe - guaranteed layout completion

// ============ Generic Helpers ============

/** Run cleanup immediately or on abort, then return the callable cleanup.
 * @param cleanup Cleanup function to protect.
 * @param signal Optional abort signal.
 * @returns The wrapped cleanup function.
 */
export function bindCleanupToSignal<Cb extends () => any>(cleanup: Cb, signal?: AbortSignal): Cb {
  signal?.aborted ? cleanup() : signal?.addEventListener("abort", cleanup, { once: true });
  if (signal && !signal.aborted) cleanup = (() => (signal.removeEventListener("abort", cleanup), cleanup())) as Cb;
  return cleanup; // once incase spec changes, memory leaks too
} // for simple one-way cleanup functions without off logic elsewhere
