// ===========================================================================
// FOSSILS (Older way of doing things for posterity)
// ===========================================================================

// ==========================================
// V0 ARCHITECTURE (Reactor Fossil Reference)
// ==========================================
export const TERMINATOR = Symbol("TERMINATOR");
export class Reactor {
  constructor(object) {
    (this.getters = new Map()), (this.setters = new Map()), (this.listeners = new Map());
    (this.batch = new Map()), (this.isBatching = false); // Scheduler flag
    this.proxyCache = new WeakMap();
    this.root = this._proxify(object);
  }
  _proxify(target, path = "") {
    if (target instanceof Element || target instanceof Window || target instanceof EventTarget) return target;
    if (this.proxyCache.has(target)) return this.proxyCache.get(target);
    this.proxyCache.set(
      target,
      new Proxy(target, {
        get: (object, key, receiver) => {
          const safeKey = String(key),
            fullPath = path ? path + "." + safeKey : safeKey,
            target = { path: fullPath, value: Reflect.get(object, key, receiver), oldValue: undefined, key: safeKey, object },
            payload = { type: "get", target, currentTarget: target, root: this.root };
          return this.getters.has(fullPath) ? this._mediate(fullPath, payload, false) : typeof key === "symbol" || (typeof target.value === "object" && target.value !== null) ? target.value : this._proxify(target.value, path ? `${path}.${key}` : key);
        },
        set: (object, key, value, receiver) => {
          const safeKey = String(key),
            fullPath = path ? path + "." + safeKey : safeKey,
            target = { path: fullPath, value, oldValue: Reflect.get(object, key, receiver), key: safeKey, object },
            payload = { type: "set", target, currentTarget: target, root: this.root };
          if (this.setters.has(fullPath)) target.value = this._mediate(fullPath, payload, true);
          if (target.value === TERMINATOR || !Reflect.set(object, key, target.value, receiver)) return false; // stopping it at the root unlike vjs :)
          return this._schedule(target.path, payload), this._bubble(path, payload), true;
        },
        deleteProperty: (object, key) => {
          const safeKey = String(key),
            fullPath = path ? path + "." + safeKey : safeKey,
            target = { path: fullPath, oldValue: Reflect.get(object, key), key: safeKey, object },
            payload = { type: "delete", target, currentTarget: target, root: this.root };
          if (this.setters.has(fullPath)) target.value = this._mediate(fullPath, payload, true);
          if (target.value === TERMINATOR || !Reflect.deleteProperty(object, key)) return false;
          return this._schedule(target.path, payload), this._bubble(path, payload), true;
        },
      })
    );
    return this.proxyCache.get(target);
  }
  _mediate(path, payload, set = true) {
    let terminated = false,
      value = payload.target.value;
    const fns = (set ? this.setters : this.getters)?.get(path);
    if (!fns?.size) return value;
    const arr = Array.from(fns);
    for (let i = set ? 0 : arr.length - 1; i !== (set ? arr.length : -1); i += set ? 1 : -1) {
      terminated ||= value === TERMINATOR;
      value = terminated ? TERMINATOR : arr[i](value, terminated, payload);
    }
    return value;
  }
  _bubble(path, { type, target: currentTarget, root }) {
    const parts = path ? path.split(".") : [];
    let parent = root;
    for (let i = 0; i < parts.length; i++) {
      const target = { path: parts.slice(0, i + 1).join("."), value: (parent = Reflect.get(parent, parts[i])), key: parts[i], object: parent };
      this._schedule(target.path, { type: "update", target, currentTarget, root });
    }
    this._schedule("*", { type, target: { path: "*", value: root, object: root }, currentTarget, root });
  }
  _schedule(path, payload) {
    this.batch.set(path, payload);
    if (!this.isBatching) (this.isBatching = true), queueMicrotask(() => this._flush());
  }
  _flush() {
    for (const [path, payload] of this.batch.entries()) this.listeners.get(path)?.forEach((cb) => cb(payload));
    this.batch.clear(), (this.isBatching = false);
  }
  get = (path, callback) => (this.getters.get(path) ?? this.getters.set(path, new Set()).get(path)).add(callback);
  noget = (path, callback) => this.getters.get(path)?.delete(callback);
  set = (path, callback) => (this.setters.get(path) ?? this.setters.set(path, new Set()).get(path)).add(callback);
  noset = (path, callback) => this.setters.get(path)?.delete(callback);
  on = (path, callback) => (this.listeners.get(path) ?? this.listeners.set(path, new Set()).get(path)).add(callback);
  off = (path, callback) => this.listeners.get(path)?.delete(callback);
  propagate = ({ type, target: { path: path, value: sets } }) => (type === "set" || type === "delete") && sets && Object.entries(sets).forEach(([k, v]) => tmg.assignAny(this.root, `${path}.${k}`, v));
  tick = this._flush;
  reset = () => (this.getters.clear(), this.setters.clear(), this.listeners.clear(), this.batch.clear(), (this.isBatching = false), (this.proxyCache = new WeakMap()), true);
  destroy = () => (this.reset(), (this.getters = this.setters = this.listeners = this.batch = this.proxyCache = null));
}
export function reactify(target, root) {
  const keys = Object.keys(target),
    core = new Reactor(target);
  Object.assign(root ?? core.root, {
    get: core.get.bind(core),
    noget: core.noget.bind(core),
    set: core.set.bind(core),
    noset: core.noset.bind(core),
    on: core.on.bind(core),
    off: core.off.bind(core),
    propagate: core.propagate.bind(core),
    tick: core.tick.bind(core),
    reset: core.reset.bind(core),
    destroy: core.destroy.bind(core),
  });
  return root && keys.forEach((k) => (root[k] = core.root[k])), core.root;
}

/**  Instant state reconstruction (Teleport), Collapses history into a single "Truth" map and injects it. */
// public jumpTo(index: number) {
//   this.isPlaying = true;
//   this.currentFrame = clamp(-1, index, this.history.length - 1); // Ensure playhead stays within bounds
//   // 1. Establish the Floor (Genesis)
//   const map = new Map<string, [any, HistoryEntry["type"]]>([["*", [deepClone(this.initialState, this.rtr.config), "set"]]]); // Snapshot map avoids "flicker" by calculating the final value per path first
//   // 2. Overwrite Genesis with the Timeline up to target (Log Compaction)
//   if (this.currentFrame !== -1)
//     for (let i = 0; i <= this.currentFrame; i++) {
//       const e = this.history[i];
//       map.set(e.path, [e.value, e.type]);
//     }
//   // 3. Surgical Application
//   const affected: string[] = [];
//   map.forEach((entry, path) => (entry[1] === "delete" ? deleteAny(this.rtr.core, path as any) : setAny(this.rtr.core, path as any, deepClone(entry[0], this.rtr.config)), affected.push(path))); // clone to avoid rewriting history due to shallow copying
//   // 4. Batch Flush: Flush ALL teleportation ripples before we drop the shield!
//   this.rtr.tick();
//   this.isPlaying = false;
// }

// import { useSyncExternalStore, useRef, useCallback } from "react";
// import { useISOLayoutEffect } from "../utils";
// import { NOOP } from "../../../core/consts";
// import { Reactor } from "../../../core/reactor";
// import type { EffectOptions } from "../../../types/reactor";
// import type { Reactive } from "../../../core/mixins";
// import { Autotracker } from "../../autotracker";

// /**
//  * Subscribes to a derived slice of Reactor state.
//  * The selector runs against a tracked snapshot and uses the provided equality function
//  * to suppress unchanged results.
//  * @typeParam T Root state object type.
//  * @typeParam R Selector return type.
//  * @param target Reactive object, Reactor instance, or plain object.
//  * @param sel Slice selector.
//  * @param eq Equality function used to compare consecutive selector results.
//  * @param options Watcher options if `options.sync: false` else Listener options.
//  * @returns The selected slice.
//  * @example
//  * const a = useSelector({ user: { name: "Ada" } }, (s) => s.user.name);
//  * @example
//  * const state = reactive({ user: { name: "Ada" } });
//  * const b = useSelector(state, (s) => s.user.name);
//  * @example
//  * const rtr = new Reactor({ user: { name: "Ada" } });
//  * const c = useSelector(rtr, (s) => s.user.name);
//  */
// export function useSelector<T extends object, R>(target: T | Reactor<T> | Reactive<T>, sel: (state: T) => R, eq = Object.is, options?: EffectOptions): R {
//   const tgtRef = useRef<T | Reactor<T> | Reactive<T>>(),
//     rtrRef = useRef<Reactor<T>>(),
//     rtr = tgtRef.current !== target || !rtrRef.current ? ((tgtRef.current = target), (rtrRef.current = target instanceof Reactor ? target : (target as Reactive<T>).__Reactor__ || new Reactor(target, { referenceTracking: true, smartCloning: true }))) : rtrRef.current,
//     atrkrRef = useRef<Autotracker<T>>(),
//     atrkrRtrRef = useRef<Reactor<T>>(),
//     atrkr = atrkrRtrRef.current !== rtr || !atrkrRef.current ? ((atrkrRtrRef.current = rtr), (atrkrRef.current = new Autotracker(rtr))) : atrkrRef.current,
//     notifyRef = useRef<() => void>(NOOP),
//     sliceRef = useRef<R>(),
//     selRef = useRef(sel),
//     eqRef = useRef(eq),
//     optsRef = useRef(options);
//   rtr.config.referenceTracking = rtr.config.smartCloning = true;
//   ((optsRef.current = options), (selRef.current = sel), (eqRef.current = eq)); // preventing staleness
//   const subscribe = useCallback((notify: () => void) => (atrkr.callback((notifyRef.current = notify), optsRef.current), () => atrkr.cleanup()), [atrkr]);
//   const getSnapshot = useCallback(() => {
//     const next = selRef.current(atrkr.tracked(rtr.snapshot()));
//     return eqRef.current(sliceRef.current, next) ? sliceRef.current! : (sliceRef.current = next);
//   }, [atrkr]);
//   const slice = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

//   return useISOLayoutEffect(() => atrkr.callback(notifyRef.current, optsRef.current), [atrkr, slice]), slice;
// } // Nothing much here, just rebuilding "Zustand.js" `useSelector`, Proof of Concept: Reactor is a core of cores

// import { useSyncExternalStore, useRef, useMemo, useCallback } from "react";
// import { useISOLayoutEffect } from "../utils";
// import { NOOP } from "../../../core/consts";
// import { Reactor } from "../../../core/reactor";
// import type { EffectOptions } from "../../../types/reactor";
// import type { Reactive } from "../../../core/mixins";
// import { Autotracker } from "../../autotracker";

// /**
//  * Subscribes a component to Reactor state and returns a tracked snap snapshot.
//  * Rule of thumb: read from snapshots, mutate the source.
//  * The hook uses access tracking so re-renders occur only when accessed fields change.
//  * @typeParam T Root state object type.
//  * @param target Reactive object, Reactor instance, or plain object.
//  * @param options Watcher options if `options.sync: false` else Listener options.
//  * @returns Tracked snapshot snap for render usage.
//  * @example
//  * const a = useReactor({ user: { name: "Ada" } });
//  * @example
//  * const state = reactive({ user: { name: "Ada" } });
//  * const b = useReactor(state);
//  * @example
//  * const rtr = new Reactor({ user: { name: "Ada" } });
//  * const c = useReactor(rtr);
//  */
// export function useReactor<T extends object>(target: T | Reactor<T> | Reactive<T>, options?: EffectOptions): T {
//   const tgtRef = useRef<T | Reactor<T> | Reactive<T>>(),
//     rtrRef = useRef<Reactor<T>>(),
//     rtr = tgtRef.current !== target || !rtrRef.current ? ((tgtRef.current = target), (rtrRef.current = target instanceof Reactor ? target : (target as Reactive<T>).__Reactor__ || new Reactor(target, { referenceTracking: true, smartCloning: true }))) : rtrRef.current,
//     atrkrRef = useRef<Autotracker<T>>(),
//     atrkrRtrRef = useRef<Reactor<T>>(),
//     atrkr = atrkrRtrRef.current !== rtr || !atrkrRef.current ? ((atrkrRtrRef.current = rtr), (atrkrRef.current = new Autotracker(rtr))) : atrkrRef.current,
//     notifyRef = useRef<() => void>(NOOP),
//     optsRef = useRef(options);
//   rtr.config.referenceTracking = rtr.config.smartCloning = true;
//   optsRef.current = options; // preventing staleness
//   const subscribe = useCallback((notify: () => void) => (atrkr.callback((notifyRef.current = notify), optsRef.current), () => atrkr.cleanup()), [atrkr]);
//   const getSnapshot = () => rtr.snapshot();
//   const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
//   const proxy = useMemo(() => atrkr.tracked(snapshot), [atrkr, snapshot]);
//   return useISOLayoutEffect(() => atrkr.callback(notifyRef.current, optsRef.current), [atrkr, proxy]), proxy;
// } // Nothing much here, just rebuilding "Valtio.js" `useSnapshot`, Proof of Concept: Reactor is a core of cores
