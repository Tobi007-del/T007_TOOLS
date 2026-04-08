import type { EffectOptions } from "../../types/reactor";
import { Autotracker, withTracker } from "../autotracker";

/**
 * Runs a reactive side effect in vanilla JavaScript.
 * The callback executes immediately, tracks accessed state, and re-runs when
 * tracked dependencies change.
 * @param callback Effect callback.
 * @param options Listener options if `sync: false` else Watcher Options.
 * @returns Cleanup function that stops tracking and releases resources.
 * @example
 * const stop = effect(() => console.log(state.count));
 */
export function effect(callback: () => void, options?: EffectOptions): () => void {
  const atrkr = new Autotracker();
  let destroyed = false;
  (function execute() {
    if (!destroyed) withTracker(atrkr, () => callback()), atrkr.callback(execute, options);
  })();
  return () => ((destroyed = true), atrkr.destroy());
}
