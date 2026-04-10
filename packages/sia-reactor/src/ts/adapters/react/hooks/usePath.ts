import { useRef, useSyncExternalStore, useCallback } from "react";
import { NIL } from "../../../core/consts";
import { Reactor } from "../../../core/reactor";
import { type Reactive, getReactor } from "../../../core/mixins";
import type { EffectOptions, ReactorBuild } from "../../../types/reactor";
import type { WildPaths, PathValue } from "../../../types/obj";
import { getAny } from "../../../utils/obj";

/**
 * Subscribes to a single path in Reactor state.
 * Uses sync watcher mode when `options.sync` is enabled; otherwise uses event listeners.
 * @typeParam T Root state object type.
 * @typeParam P Path or wildcard path type.
 * @param target Reactive object, Reactor instance, or plain object.
 * @param path Path to observe. Supports dotted paths and wildcard `"*"`.
 * @param options Watcher options if `options.sync: false` else Listener options.
 * @param build Optional Reactor build options used when creating a scoped Reactor for plain objects.
 * @returns Current value at the requested path.
 * @example
 * const a = usePath({ user: { profile: { name: "Ada" } } }, "user.profile.name");
 * @example
 * const state = reactive({ user: { profile: { name: "Ada" } } });
 * const b = usePath(state, "user.profile.name");
 * @example
 * const rtr = new Reactor({ user: { profile: { name: "Ada" } } });
 * const c = usePath(rtr, "user.profile.name");
 * @example
 * const wholeState = usePath(state, "*");
 */
export function usePath<T extends object, P extends WildPaths<T>>(target: T | Reactor<T> | Reactive<T>, path: P, options: EffectOptions = NIL, build?: ReactorBuild<T>): PathValue<T, P> {
  const versionRef = useRef(0),
    tgtRef = useRef<T | Reactor<T> | Reactive<T>>(), // HMR Survival
    rtrRef = useRef<Reactor<T>>(),
    rtr = tgtRef.current !== target || !rtrRef.current ? ((tgtRef.current = target), (rtrRef.current = getReactor(target, true, build))) : rtrRef.current,
    optsRef = useRef(options);
  optsRef.current = options; // preventing staleness
  const subscribe = useCallback((notify: () => void) => rtr[optsRef.current.sync ? "watch" : "on"](path, () => (versionRef.current++, notify()), optsRef.current), [rtr, path]);
  const getSnapshot = useCallback(() => versionRef.current, []);
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot); // Feed React a primitive number to track tearing, zero cloning.
  return getAny(rtr.core, path);
}
