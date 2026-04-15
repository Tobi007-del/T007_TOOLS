import { useSyncExternalStore, useRef, useCallback } from "react";
import { useISOLayoutEffect } from "../utils";
import { NIL, NOOP } from "../../../core/consts";
import { Reactor } from "../../../core/reactor";
import { type Reactive, getReactor } from "../../../core/mixins";
import type { EffectOptions, ReactorBuild } from "../../../types/reactor";
import { Autotracker, withTracker } from "../../autotracker";

/**
 * Subscribes to a derived slice of Reactor state.
 * The selector runs against the live state and uses the provided equality function
 * to suppress unchanged results.
 * @typeParam T Root state object type.
 * @typeParam R Selector return type.
 * @param target Reactive object, Reactor instance, or plain object.
 * @param sel Slice selector.
 * @param eq Equality function used to compare consecutive selector results.
 * @param options Watcher options if `options.sync: false` else Listener options.
 * @param build Optional Reactor build options used when creating a scoped Reactor for plain objects.
 * @returns The selected slice.
 * @example
 * const a = useSelector({ user: { name: "Kosi" } }, (s) => s.user.name); // per-component scoped
 * @example
 * const state = reactive({ user: { name: "Kosi" } });
 * const b = useSelector(state, (s) => s.user.name);
 * @example
 * const rtr = new Reactor({ user: { name: "Kosi" } });
 * const c = useSelector(rtr, (s) => s.user.name);
 */
export function useSelector<T extends object, R>(target: T | Reactor<T> | Reactive<T>, sel: (state: T) => R, eq: (prev: R | undefined, next: R) => boolean = Object.is, options: EffectOptions = NIL, build?: ReactorBuild<T>): R {
  const rtrRef = useRef<Reactor<T>>(),
    tgtRef = useRef<T | Reactor<T> | Reactive<T>>(), // HMR Survival
    rtr = tgtRef.current !== target || !rtrRef.current ? ((tgtRef.current = target), (rtrRef.current = getReactor(target, true, build))) : rtrRef.current,
    atrkrRef = useRef<Autotracker<T>>(),
    atrkr = (atrkrRef.current ||= new Autotracker()), // assigned after to avoid waste of new instances
    notifyRef = useRef<() => void>(NOOP),
    sliceRef = useRef<R>(),
    selRef = useRef(sel),
    eqRef = useRef(eq),
    optsRef = useRef(options);
  (selRef.current = sel), (eqRef.current = eq), (optsRef.current = options); // preventing staleness
  const subscribe = useCallback((notify: () => void) => atrkr.callback((notifyRef.current = notify), optsRef.current), [atrkr]);
  const getSnapshot = useCallback(() => {
    const next = withTracker(atrkr, () => selRef.current(rtr.core), rtr);
    return eqRef.current(sliceRef.current, next) ? sliceRef.current! : (sliceRef.current = next);
  }, [atrkr, rtr]);
  const slice = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return useISOLayoutEffect(() => atrkr.callback(notifyRef.current, optsRef.current), [atrkr, slice]), slice;
}

/**
 * Subscribes to a derived slice of any Reactor state.
 * The selector runs against the live state and uses the provided equality function
 * to suppress unchanged results.
 * @typeParam R Selector return type.
 * @param sel Slice selector.
 * @param eq Equality function used to compare consecutive selector results.
 * @param options Watcher options if `options.sync: false` else Listener options.
 * @returns The selected slice.
 */
export function useAnySelector<R>(sel: () => R, eq = Object.is, options: EffectOptions = NIL): R {
  const atrkrRef = useRef<Autotracker<any>>(),
    atrkr = (atrkrRef.current ||= new Autotracker()),
    notifyRef = useRef<() => void>(NOOP),
    sliceRef = useRef<R>(),
    selRef = useRef(sel),
    eqRef = useRef(eq),
    optsRef = useRef(options);
  (selRef.current = sel), (eqRef.current = eq), (optsRef.current = options); // preventing staleness
  const subscribe = useCallback((notify: () => void) => atrkr.callback((notifyRef.current = notify), optsRef.current), [atrkr]);
  const getSnapshot = useCallback(() => {
    const next = withTracker(atrkr, () => selRef.current());
    return eqRef.current(sliceRef.current, next) ? sliceRef.current! : (sliceRef.current = next);
  }, [atrkr]);
  const slice = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return useISOLayoutEffect(() => atrkr.callback(notifyRef.current, optsRef.current), [atrkr, slice]), slice;
}

/**
 * Subscribes to a derived slice of Reactor state.
 * The selector runs against a tracked snapshot and uses the provided equality function
 * to suppress unchanged results.
 * @typeParam T Root state object type.
 * @typeParam R Selector return type.
 * @param target Reactive object, Reactor instance, or plain object.
 * @param sel Slice selector.
 * @param eq Equality function used to compare consecutive selector results.
 * @param options Watcher options if `options.sync: false` else Listener options.
 * @param build Optional Reactor build options used when creating a scoped Reactor for plain objects.
 * @returns The selected slice.
 * @example
 * const a = useSelectorSnapshot({ user: { name: "Kosi" } }, (s) => s.user.name); // per-component scoped
 * @example
 * const state = reactive({ user: { name: "Kosi" } });
 * const b = useSelectorSnapshot(state, (s) => s.user.name);
 * @example
 * const rtr = new Reactor({ user: { name: "Kosi" } });
 * const c = useSelectorSnapshot(rtr, (s) => s.user.name);
 */
export function useSelectorSnapshot<T extends object, R>(target: T | Reactor<T> | Reactive<T>, sel: (state: T) => R, eq = Object.is, options?: EffectOptions, build: ReactorBuild<T> = { referenceTracking: true, smartCloning: true }): R {
  const tgtRef = useRef<T | Reactor<T> | Reactive<T>>(),
    rtrRef = useRef<Reactor<T>>(),
    rtr = tgtRef.current !== target || !rtrRef.current ? ((tgtRef.current = target), (rtrRef.current = getReactor(target, true, build))) : rtrRef.current,
    atrkrRef = useRef<Autotracker<T>>(),
    atrkrRtrRef = useRef<Reactor<T>>(),
    atrkr = atrkrRtrRef.current !== rtr || !atrkrRef.current ? ((atrkrRtrRef.current = rtr), (atrkrRef.current = new Autotracker(rtr))) : atrkrRef.current,
    notifyRef = useRef<() => void>(NOOP),
    sliceRef = useRef<R>(),
    selRef = useRef(sel),
    eqRef = useRef(eq),
    optsRef = useRef(options);
  rtr.config.referenceTracking = rtr.config.smartCloning = true;
  (optsRef.current = options), (selRef.current = sel), (eqRef.current = eq); // preventing staleness
  const subscribe = useCallback((notify: () => void) => (atrkr.callback((notifyRef.current = notify), optsRef.current), () => atrkr.cleanup()), [atrkr]);
  const getSnapshot = useCallback(() => {
    const next = selRef.current(atrkr.tracked(rtr.snapshot()));
    return eqRef.current(sliceRef.current, next) ? sliceRef.current! : (sliceRef.current = next);
  }, [atrkr]);
  const slice = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return useISOLayoutEffect(() => atrkr.callback(notifyRef.current, optsRef.current), [atrkr, slice]), slice;
} // Nothing much here, just rebuilding "Zustand.js" `useSelector`, Proof of Concept: Reactor is a core of cores
