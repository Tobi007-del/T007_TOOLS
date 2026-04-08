// ============ Timer Helpers ============

// 3rd & 4th param are consumed if signal and window are used respectively
/**
 * setTimeout wrapper with optional AbortSignal and Window overrides.
 * @param handler Timeout callback or handler string.
 * @param timeout Delay in milliseconds.
 * @param args Optional args, where first may be AbortSignal and second may be Window to be consumed for enhancements.
 * @returns Timer id, or -1 when signal is already aborted.
 */
export function setTimeout(handler: TimerHandler, timeout?: number, ...args: any[]) {
  const sig = args[0] instanceof AbortSignal ? args.shift() : undefined;
  if (sig?.aborted) return -1;
  const win: Window = args[0] instanceof Window ? args.shift() : window;
  if (!sig) return win.setTimeout(handler, timeout, ...args);
  const id = win.setTimeout(() => (sig.removeEventListener("abort", kill), "string" === typeof handler ? new Function(handler) : handler(...args)), timeout),
    kill = () => win.clearTimeout(id);
  return sig.addEventListener("abort", kill, { once: true }), id;
}

/**
 * setInterval wrapper with optional AbortSignal and Window overrides.
 * @param handler Interval callback or handler string.
 * @param timeout Interval delay in milliseconds.
 * @param args Optional args, where first may be AbortSignal and second may be Window to be consumed for enhancements.
 * @returns Interval id, or -1 when signal is already aborted.
 */
export function setInterval(handler: TimerHandler, timeout?: number, ...args: any[]) {
  const sig = args[0] instanceof AbortSignal ? args.shift() : undefined;
  if (sig?.aborted) return -1;
  const win: Window = args[0] instanceof Window ? args.shift() : window,
    id = win.setInterval(handler, timeout, ...args);
  return sig?.addEventListener("abort", () => win.clearInterval(id), { once: true }), id;
}

/**
 * requestAnimationFrame wrapper with optional AbortSignal and Window overrides.
 * @param callback Frame callback.
 * @param sig Optional AbortSignal to cancel scheduled frame.
 * @param win Optional Window override.
 * @returns Frame request id, or -1 when signal is already aborted.
 */
export function requestAnimationFrame(callback: FrameRequestCallback, sig?: AbortSignal, win = window) {
  if (sig?.aborted) return -1;
  if (!sig) return win.requestAnimationFrame(callback);
  const id = win.requestAnimationFrame((t) => (sig.removeEventListener("abort", kill), callback(t))),
    kill = () => win.cancelAnimationFrame(id);
  return sig.addEventListener("abort", kill, { once: true }), id;
}
