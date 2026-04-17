import { RAW, INERTIA, REJECTABLE, INDIFFABLE, VERSION, SSVERSION, NIL } from "./consts";
import { Reactor } from "./reactor";
import type { ReactorBuild, Inert, Intent, Live, State, Volatile, Stable } from "../types/reactor";

/** Reactor method names exposed on objects returned by {@link reactive}. */
export const methods = ["tick", "stall", "nostall", "get", "gonce", "noget", "set", "sonce", "noset", "delete", "donce", "nodelete", "watch", "wonce", "nowatch", "on", "once", "off", "snapshot", "use", "reset", "destroy"] as const;

type Method = (typeof methods)[number];
type Prefix<P extends ReactivePreferences | undefined> = P extends { prefix?: infer X extends string } ? X : "";
type Suffix<P extends ReactivePreferences | undefined> = P extends { suffix?: infer X extends string } ? X : "";
type Whitelist<P extends ReactivePreferences | undefined> = P extends { whitelist?: infer W extends readonly Method[] } ? W[number] : never;
type ReactiveMethodMap<T extends object, P extends ReactivePreferences | undefined> = {
  [K in Method as [Prefix<P>, Suffix<P>] extends ["", ""] ? (P extends { whitelist: readonly Method[] } ? (K extends Whitelist<P> ? never : K) : K) : P extends { whitelist: readonly Method[] } ? (K extends Whitelist<P> ? `${Prefix<P>}${K}${Suffix<P>}` : K) : `${Prefix<P>}${K}${Suffix<P>}`]: Pick<Reactor<T>, Method>[K];
};

export interface ReactivePreferences {
  /** Prefix applied to exposed reactor methods. */
  prefix?: string;
  /** Suffix applied to exposed reactor methods. */
  suffix?: string;
  /** Methods that should keep their original names when affixes are used. */
  whitelist?: readonly Method[]; // keys you're already using
}
export type Reactive<T extends object, P extends ReactivePreferences | undefined = undefined> = T & ReactiveMethodMap<T, P> & { __Reactor__: Reactor<T> };

/**
 * Attaches `Reactor` APIs to a state object and returns its reactive proxy from the reactor's core.
 * If an existing `reactive()` object is passed, it is re-returned ignoring change in preferences.
 * @param target Source state object or an existing Reactor instance.
 * @param build Reactor initial configuration.
 * @param preferences Method naming preferences for exposed APIs.
 * @returns Reactive object with mapped Reactor methods and `__Reactor__`.
 * @example
 * const state = reactive({ user: { name: "Kosi" } });
 * state.set("user.name", (v) => v);
 * @example
 * const rtr = new Reactor({ count: 0 });
 * const state = reactive(rtr);
 */
export function reactive<T extends object, const P extends ReactivePreferences | undefined = undefined>(target: T, build?: ReactorBuild<T>, preferences: P = NIL): T extends Reactive<infer O, infer P> ? T : Reactive<T, P> {
  if ("__Reactor__" in target) return target as any;
  const descriptors: PropertyDescriptorMap = {},
    rtr = getReactor(target, true, build),
    locks = { enumerable: false, configurable: true, writable: false },
    hasAffix = !!(preferences.prefix || preferences.suffix);
  for (let i = 0, len = methods.length; i < len; i++) {
    let key = methods[i];
    if (hasAffix) (preferences.whitelist?.includes(key) ?? true) && (key = `${preferences.prefix || ""}${key}${preferences.suffix || ""}` as Method);
    else if (preferences.whitelist?.includes(key)) continue;
    descriptors[key] = { value: rtr[methods[i]].bind(rtr), ...locks };
  }
  descriptors["__Reactor__"] = { value: rtr, ...locks };
  return Object.defineProperties(rtr.core, descriptors), rtr.core as any;
}

/**
 * Marks an object as intent (rejectable).
 * @param target Object to mark.
 * @returns The same object with intent typing.
 */
export function intent<T extends object>(target: T): Intent<T> {
  return (getRaw(target as any)[REJECTABLE] = true), target as Intent<T>;
}
/**
 * Removes intent (rejectable) behavior from an object.
 * @param target Object to unmark.
 * @returns The same object with state typing.
 */
export function state<T extends object>(target: T): State<T> {
  return delete getRaw(target as any)[REJECTABLE], target as State<T>;
}
/**
 * Checks whether an object is marked as intent.
 * @param target Object to test.
 * @returns `true` when marked as intent.
 */
export function isIntent<T extends object>(target: T = NIL): target is Intent<T> {
  return !!getRaw(target as any)[REJECTABLE];
}

/**
 * Marks an object as inert so it is skipped by proxy mediation.
 * @param target Object to mark.
 * @returns The same object with inert typing.
 */
export function inert<T extends object>(target: T): Inert<T> {
  return (getRaw(target as any)[INERTIA] = true), target as Inert<T>;
}
/**
 * Removes the inert marker from an object.
 * @param target Object to unmark.
 * @returns The same object with live typing.
 */
export function live<T extends object>(target: T): Live<T> {
  return delete getRaw(target as any)[INERTIA], target as Live<T>;
}
/**
 * Checks whether an object is marked as inert.
 * @param target Object to test.
 * @returns `true` when inert.
 */
export function isInert<T extends object>(target: T = NIL): target is Inert<T> {
  return !!getRaw(target as any)[INERTIA];
}

/**
 * Marks an object as volatile (indiffable enabled).
 * @param target Object to mark.
 * @returns The same object with volatile typing.
 */
export function volatile<T extends object>(target: T): Volatile<T> {
  return (getRaw(target as any)[INDIFFABLE] = true), target as Volatile<T>;
}
/**
 * Removes volatile behavior from an object.
 * @param target Object to unmark.
 * @returns The same object with stable typing.
 */
export function stable<T extends object>(target: T): Stable<T> {
  return delete getRaw(target as any)[INDIFFABLE], target as Stable<T>;
}
/**
 * Checks whether an object is marked as volatile.
 * @param target Object to test.
 * @returns `true` when marked as volatile.
 */
export function isVolatile<T extends object>(target: T = NIL): target is Volatile<T> {
  return !!getRaw(target as any)[INDIFFABLE];
}

/**
 * Gets the underlying `Reactor` instance associated with a `reactive()` object,
 * returns the `Reactor` itself if given, or optionally creates one for plain objects.
 * @param target Object to retrieve `Reactor` from.
 * @param create When `true`, creates a new `Reactor` for plain objects when none exists.
 * @param build Optional `Reactor` build options used only when `create` initializes a new instance.
 * @returns `Reactor` instance or `undefined` if not reactive and `create` is false.
 */
export function getReactor<T extends object>(target: Reactor<T>, create?: boolean, build?: ReactorBuild<T>): Reactor<T>;
export function getReactor<T extends object>(target: Reactive<T>, create?: boolean, build?: ReactorBuild<T>): Reactor<T>;
export function getReactor<T extends object>(target: T, create: true, build?: ReactorBuild<T>): Reactor<T>;
export function getReactor<T extends object>(target: T, create?: false, build?: ReactorBuild<T>): Reactor<T> | undefined;
export function getReactor<T extends object>(target: T | Reactor<T> | Reactive<T>, create: true, build?: ReactorBuild<T>): Reactor<T>;
export function getReactor<T extends object>(target: T | Reactor<T> | Reactive<T>, create?: false, build?: ReactorBuild<T>): Reactor<T> | undefined;
export function getReactor<T extends object>(target: T | Reactor<T> | Reactive<T>, create = false, build?: ReactorBuild<T>): Reactor<T> | undefined {
  return (target instanceof Reactor ? target : (target as Reactive<T>).__Reactor__) || (create ? new Reactor(target as T, build) : undefined);
}

/**
 * Gets the raw (unproxied) version of an object if it's proxied, otherwise returns the original object.
 * @param target Object to unwrap.
 * @returns Raw object if proxied, else the original object. Use `Reactor.snapshot(true)` for deep unwrapping.
 */
export function getRaw<T extends object>(target: T = NIL): T {
  return (target as any)[RAW] || target;
}

/**
 * Gets the current structural version of an object.
 * @param target Object to inspect.
 * @returns Version number.
 */
export function getVersion<T extends object>(target: T = NIL): number {
  return getRaw(target as any)[VERSION] || 0;
}
/**
 * Gets the current snapshot-cache version of an object.
 * @param target Object to inspect.
 * @returns Snapshot version number.
 */
export function getSnapshotVersion<T extends object>(target: T = NIL): number {
  return getRaw(target as any)[SSVERSION] || 0;
}
