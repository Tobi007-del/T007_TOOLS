import { CTX, NIL, RAW } from "../core/consts";
import { Reactor } from "../core/reactor";
import type { EffectOptions } from "../types/reactor";
import type { WildPaths, DeepReadonly } from "../types/obj";
import { canHandle, nuke } from "../utils/obj";

export let activeTracker: Autotracker<any> | null = null;

// ===========================================================================
// The S.I.A (State Intent Architecture) `AutoTracker`
// ===========================================================================

/**
 * - Auto-dependency tracker used to subscribe only to accessed paths.
 * - `tracked(...)` wraps a snapshot in a read-tracking proxy, and `callback(...)`
 * binds subscriptions for collected paths using `watch` (sync) or `on` (batched).
 * @typeParam T Root state object type.
 */
export class Autotracker<T extends object> {
  public proxy!: T;
  public deps = new Map<Reactor<any>, Set<string>>();
  public isTracking = true;
  protected rtr?: Reactor<T>;
  /** only allows one reactor to autotrack when available */
  protected autortr?: Reactor<T>;
  protected clups: Array<() => void> = [];
  protected lastPath?: WildPaths<T>;
  protected proxyCache = new WeakMap<object, any>();

  /** @param rtr Reactor instance used for path subscriptions. */
  constructor(rtr?: Reactor<T>) {
    this.autortr = this.rtr = rtr;
  }

  /**
   * Starts a new tracking pass and returns a readonly tracking proxy for `target` if `this` was instantiated with a `Reactor`.
   * @param target Snapshot (or state branch) to track reads from.
   * @returns Read-tracking readonly proxy.
   * @example
   * const atrkr = new Autotracker(rtr);
   * const state = atrkr.tracked(rtr.snapshot());
   * const name = state.user.profile.name;
   */
  public tracked(target: T): DeepReadonly<T> {
    return this.unblock(), (this.proxy = this.proxied(target, "")) as DeepReadonly<T>;
  }
  protected proxied<O extends object>(obj: O, path: string): O {
    if (!this.rtr || !obj || "object" !== typeof obj) return obj;
    const cached = this.proxyCache.get(obj);
    if (cached) return cached;
    if (!canHandle(obj, this.rtr!.config, false)) return obj;
    const proxy = new Proxy(obj, {
      // Minimal Proxy Handler
      get: (object, key, receiver) => {
        if (key === RAW) return this.rtr!.log(`👀 [AutoTracker \`get\` Trap] Peeked at ${object}`), object;
        const keyStr = String(key),
          fullPath = (path ? `${path}.${keyStr}` : keyStr) as WildPaths<T>;
        return this.rtr!.log(`🔍 [AutoTracker \`get\` Trap] Initiated for "${keyStr}" on "${path}"`), this.track(fullPath), this.proxied(!this.rtr!.config.preserveContext ? (object as any)[key] : Reflect.get(object, key, receiver), fullPath);
      },
      has: (object, key) => {
        const keyStr = String(key),
          fullPath = (path ? `${path}.${keyStr}` : keyStr) as WildPaths<T>;
        return this.rtr!.log(`❓ [AutoTracker \`has\` Trap] Initiated for "${keyStr}" on "${path}"`), this.track(fullPath), !this.rtr!.config.preserveContext ? key in object : Reflect.has(object, key);
      },
      getOwnPropertyDescriptor: (object, key) => {
        const keyStr = String(key),
          fullPath = (path ? `${path}.${keyStr}` : keyStr) as WildPaths<T>;
        return this.rtr!.log(`📋 [AutoTracker \`getOwnPropertyDescriptor\` Trap] Initiated for "${keyStr}" on "${path}"`), this.track(fullPath), !this.rtr!.config.preserveContext ? Object.getOwnPropertyDescriptor(object, key) : Reflect.getOwnPropertyDescriptor(object, key);
      },
      ownKeys: (object) => {
        const safePath = (path || "*") as WildPaths<T>;
        return this.rtr!.log(`🔑 [AutoTracker \`ownKeys\` Trap] Initiated on "${safePath}"`), this.track(safePath), Reflect.ownKeys(object); // no faster accurate way without Reflect API
      },
      set: (_, key) => {
        throw new Error(`🛡️ [AutoTracker \`set\` Trap] Blocked for "${String(key)}" on "${path}"`); // semantic unlike proxy default error
      },
      deleteProperty: (_, key) => {
        throw new Error(`🛡️ [AutoTracker \`deleteProperty\` Trap] Blocked for "${String(key)}" on "${path}"`); // semantic unlike proxy default error
      },
      defineProperty: (_, key) => {
        throw new Error(`🛡️ [AutoTracker \`defineProperty\` Trap] Blocked for "${String(key)}" on "${path}"`); // semantic unlike proxy default error
      },
      setPrototypeOf: (_, key) => {
        throw new Error(`🛡️ [AutoTracker \`setPrototypeOf\` Trap] Blocked for "${String(key)}" on "${path}"`); // semantic unlike proxy default error
      },
    });
    return this.proxyCache.set(obj, proxy), proxy;
  }

  /** Adds a path to the tracking set. */
  public track<const P extends WildPaths<T>>(path: P, rtr: Reactor<any> = this.rtr!, prune = false): P {
    if (!this.isTracking || !path || (this.autortr && this.autortr !== rtr)) return path;
    let paths = this.deps.get(rtr);
    if (!prune && !paths) paths = (this.deps.set(rtr, (paths = new Set())), paths);
    if (path.startsWith(this.lastPath + ".")) paths!.delete(this.lastPath!);
    return !prune && paths!.add((this.lastPath = path)), path;
  }
  /** Removes a path from the tracking set. */
  public untrack(path: WildPaths<T>, rtr: Reactor<any> = this.rtr!): void {
    this.deps.get(rtr)?.delete(path);
  }
  /** Enables path tracking. */
  public unblock(rtr: Reactor<any> = this.rtr!): void {
    this.deps.clear();
    this.autortr = rtr;
    this.isTracking = true;
    this.lastPath = undefined;
  }
  /** Temporarily disables path tracking. */
  public block(): void {
    this.autortr = undefined;
    this.isTracking = false;
  }

  /**
   * Subscribes an effect to tracked paths.
   * Uses `watch` when `options.sync === true` (synchronous updates), otherwise
   * uses `on` (batched/asynchronous listener wave).
   * @param cb Effect callback.
   * @param options Effect options.
   * @returns Cleanup function for active subscriptions.
   * @example
   * const atrkr = new Autotracker(rtr);
   * const view = atrkr.tracked(rtr.snapshot()); // tracked works if `rtr` was passed at instantiation
   * view.user.name;
   * const stop = atrkr.callback(() => console.log("changed")); // re-run after when ".user.name" changes
   * @example Packaged Customization
   * const atrkr = new Autotracker(); // no reactor passed
   * withTracker(atrkr, () => state.user.name); // import `withTracker` too
   * const stop = atrkr.callback(() => console.log("sync"), { sync: true }); // re-run immediately when ".user.name" changes, works on any path used from any reactor state
   * @example Extensive Customization
   * atrkr.unblock();
   * const prev = CTX.autotracker;
   * CTX.autotracker = atrkr; // import CTX first
   * state.user.name;
   * CTX.autotracker = prev;
   */
  public callback(cb: () => void, options: EffectOptions = NIL): () => void {
    this.cleanup();
    const method = options.sync ? "watch" : "on";
    for (const [rtr, paths] of this.deps) {
      if (!paths.size || paths.has("*")) rtr && this.clups.push(rtr[method as "on"]("*", cb, options));
      else for (const path of paths) this.clups.push(rtr[method as "on"](path, cb, options));
    }
    return () => this.cleanup();
  }

  /** Clears active subscriptions and blocks tracking. */
  public cleanup(): void {
    this.block();
    for (let i = 0, len = this.clups.length; i < len; i++) this.clups[i]();
    this.clups.length = 0;
  }
  public destroy(): void {
    this.deps.clear(), this.cleanup(), nuke(this);
  }
}

/**
 * Utility function to run a callback with a specific tracker context, restoring the previous context afterward.
 * @param tracker The Autotracker instance to set as the active tracker during the callback execution.
 * @param run The callback function to execute with the specified tracker context.
 * @param rtr Optional Reactor instance to associate with the tracker during execution.
 * @returns The result of the callback function.
 */
export function withTracker<T>(tracker: Autotracker<any>, run: () => T, rtr?: Reactor<any>): T {
  const prev = CTX.autotracker; // to survive nested trackers
  CTX.autotracker = tracker;
  try {
    return tracker.unblock(rtr), run();
  } finally {
    CTX.autotracker = prev;
  }
}
