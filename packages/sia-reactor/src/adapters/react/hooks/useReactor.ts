import { useRef, useReducer } from "react";
import { useISOLayoutEffect } from "../utils";
import { CTX, NIL } from "../../../core/consts";
import { Reactor } from "../../../core/reactor";
import type { Reactive } from "../../../core/mixins";
import type { EffectOptions } from "../../../types/reactor";
import { Autotracker } from "../../autotracker";

/**
 * Subscribes a component to desired Reactor state and returns it.
 * The hook uses access tracking so re-renders occur only when accessed fields change.
 * @typeParam T Root state object type.
 * @param target Reactive object, Reactor instance, or plain object.
 * @param options Watcher options if `options.sync: false` else Listener options.
 * @returns State for render usage if state is scoped locally or just desired.
 * @example
 * const a = useReactor({ user: { name: "Ada" } });
 * @example
 * const state = reactive({ user: { name: "Ada" } });
 * const b = useReactor(state);
 * @example
 * const rtr = new Reactor({ user: { name: "Ada" } });
 * const c = useReactor(rtr);
 */
export function useReactor<T extends object>(target: T | Reactor<T> | Reactive<T>, options: EffectOptions = NIL): T {
  const [, reRender] = useReducer((s) => s + 1, 0),
    tgtRef = useRef<T | Reactor<T> | Reactive<T>>(), // HMR Survival
    rtrRef = useRef<Reactor<T>>(),
    rtr = tgtRef.current !== target || !rtrRef.current ? ((tgtRef.current = target), (rtrRef.current = target instanceof Reactor ? target : (target as Reactive<T>).__Reactor__ || new Reactor(target))) : rtrRef.current,
    atrkrRef = useRef<Autotracker<T>>(),
    prevTrkr = CTX.autotracker,
    atrkr = (CTX.autotracker = atrkrRef.current ||= new Autotracker()),
    optsRef = useRef(options);
  optsRef.current = options; // preventing staleness
  atrkr.unblock(rtr), queueMicrotask(() => CTX.autotracker === atrkr && (CTX.autotracker = prevTrkr)); // in case of abort
  return useISOLayoutEffect(() => ((CTX.autotracker = prevTrkr), atrkr.callback(reRender, optsRef.current)), [atrkr]), rtr.core;
} // Nothing much here, just rebuilding "Valtio.js" `useSnapshot`, Proof of Concept: Reactor is a core of cores

/**
 * Subscribes a component to any Reactor state.
 * The hook uses access tracking so re-renders occur only when accessed fields change.
 * @param options Watcher options if `options.sync: false` else Listener options.
 * @example
 * useAnyReactor();
 */
export function useAnyReactor(options: EffectOptions = NIL): void {
  const [, reRender] = useReducer((s) => s + 1, 0),
    atrkrRef = useRef<Autotracker<any>>(),
    prevTrkr = CTX.autotracker,
    atrkr = (CTX.autotracker = atrkrRef.current ||= new Autotracker()), // assigned after to avoid waste of new instances
    optsRef = useRef(options);
  optsRef.current = options; // preventing staleness
  atrkr.unblock(), queueMicrotask(() => CTX.autotracker === atrkr && (CTX.autotracker = prevTrkr)); // in case of abort
  useISOLayoutEffect(() => ((CTX.autotracker = prevTrkr), atrkr.callback(reRender, optsRef.current)), [atrkr]);
}
