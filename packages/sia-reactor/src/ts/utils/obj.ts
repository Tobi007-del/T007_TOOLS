import { CTX, NIL, INERTIA } from "../core/consts";
import { ReactorEvent } from "../core/event";
import { Payload } from "../types/reactor";
import type { DeepMerge, Unflatten, WildPaths, PathValue, PathBranchValue } from "../types/obj";

export const arrRegex = /^([^\[\]]+)\[(\d+)\]$/;

// Type Guards

/** Checks if a value type is an object for common use cases. */
export function isObj<T extends object = object>(obj: any, arraycheck = true): obj is T {
  return "object" === typeof obj && obj !== null && (arraycheck ? !Array.isArray(obj) : true);
} // okay for common use cases but loose
/** Checks if a value is a "Plain Old Javascript Object". */
export function isPOJO<T extends object = object>(obj: any, config: { crossRealms?: boolean } = NIL, typecheck = true): obj is T {
  return (typecheck ? isObj(obj, false) : true) && (config.crossRealms ? Object.prototype.toString.call(obj) === "[object Object]" : obj.constructor === Object);
} // for strict own POJOs, handles cross-realm objects too

/** Returns whether a value can be proxied by the reactor runtime. */
export function canHandle(obj: any, config: { crossRealms?: boolean; preserveContext?: boolean } = NIL, typecheck = true): boolean {
  if ((typecheck && !isObj(obj, false)) || (obj as any)[INERTIA]) return false;
  if (Array.isArray(obj) || (!config.preserveContext && isPOJO(obj, config, false))) return true;
  if (config.preserveContext) return !(obj instanceof String) && !(obj instanceof Number) && !(obj instanceof Function) && !(obj instanceof Date) && !(obj instanceof Error) && !(obj instanceof RegExp) && !(obj instanceof Promise) && !(obj instanceof Map) && !(obj instanceof WeakMap) && !(obj instanceof Set) && !(obj instanceof WeakSet) && !(obj instanceof EventTarget); // matching types
  return false;
} // universal proxy gate for all reactive logic

// Deep Manipulation

/**
 * Gets a value by path.
 * @example
 * const state = { user: { profile: { name: "Kosi" } } };
 * const name = getAny(state, "user.profile.name");
 */
export function getAny<T extends object, const S extends string = ".", P extends WildPaths<T, S> = WildPaths<T, S>>(source: T, key: P, separator: S = "." as S, keyFunc?: (p: string) => string): PathValue<T, P, S> {
  if (key === "*") return source as any;
  if (!key.includes(separator)) return (source as any)[keyFunc ? keyFunc(key) : key];
  const keys = key.split(separator);
  let currObj: any = source;
  for (let i = 0, len = keys.length; i < len; i++) {
    const key = keyFunc ? keyFunc(keys[i]) : keys[i],
      match = key.includes("[") && key.match(arrRegex);
    if (match) {
      const [, key, iStr] = match;
      if (!Array.isArray(currObj[key]) || !(key in currObj)) return undefined!;
      currObj = currObj[key][Number(iStr)];
    } else {
      if (!isObj<Record<string, any>>(currObj) || !(key in currObj)) return undefined!;
      currObj = currObj[key];
    }
  }
  return currObj;
}

/**
 * Sets a value by path.
 * @example
 * const state = { user: { profile: { name: "Kosi" } } };
 * setAny(state, "user.profile.name", "Grace");
 * @example
 * const state = { users: [] as Array<{ name?: string }> };
 * setAny(state, "users[0].name" as any, "Kosi");
 */
export function setAny<T extends object, const S extends string = ".", P extends WildPaths<T, S> = WildPaths<T, S>>(target: T, key: P, value: PathValue<T, P, S>, separator: S = "." as S, keyFunc?: (p: string) => string): void {
  if (key === "*") return Object.assign(target, value);
  if (!key.includes(separator)) return void ((target as any)[keyFunc ? keyFunc(key) : key] = value);
  const keys = key.split(separator);
  for (let currObj: any = target, i = 0, len = keys.length; i < len; i++) {
    const key = keyFunc ? keyFunc(keys[i]) : keys[i],
      match = key.includes("[") && key.match(arrRegex);
    if (match) {
      const [, key, iStr] = match;
      if (!Array.isArray(currObj[key])) currObj[key] = [];
      if (i === len - 1) currObj[key][Number(iStr)] = value;
      else (currObj[key][Number(iStr)] ||= {}), (currObj = currObj[key][Number(iStr)]);
    } else {
      if (i === len - 1) currObj[key] = value;
      else (currObj[key] ||= {}), (currObj = currObj[key]);
    }
  }
}

/**
 * Deletes a value by path.
 * @example
 * const state = { user: { profile: { name: "Kosi" } } };
 * deleteAny(state, "user.profile.name");
 */
export function deleteAny<T extends object, const S extends string = ".", P extends WildPaths<T, S> = WildPaths<T, S>>(target: T, key: P, separator: S = "." as S, keyFunc?: (p: string) => string): void {
  if (key === "*") {
    const keys = Object.keys(target);
    for (let i = 0, len = keys.length; i < len; i++) delete (target as any)[keys[i]];
    return;
  }
  if (!key.includes(separator)) return void delete (target as any)[keyFunc ? keyFunc(key) : key];
  const keys = key.split(separator);
  for (let currObj: any = target, i = 0, len = keys.length; i < len; i++) {
    const key = keyFunc ? keyFunc(keys[i]) : keys[i],
      match = key.includes("[") && key.match(arrRegex);
    if (match) {
      const [, key, iStr] = match;
      if (!Array.isArray(currObj[key]) || !(key in currObj)) return;
      if (i === len - 1) delete currObj[key][Number(iStr)];
      else currObj = currObj[key][Number(iStr)];
    } else {
      if (!isObj<Record<string, any>>(currObj) || !(key in currObj)) return;
      if (i === len - 1) delete currObj[key];
      else currObj = currObj[key];
    }
  }
}

/**
 * Checks whether a path exists.
 * @example
 * const state = { user: { profile: { name: "Kosi" } } };
 * const ok = inAny(state, "user.profile.name"); // default loose typing due to it's usecase
 */
export function inAny<T extends object, const S extends string = ".", P extends string = string>(source: T, key: P, separator: S = "." as S, keyFunc?: (p: string) => string): boolean {
  if (key === "*") return true;
  if (!key.includes(separator)) return key in source;
  const keys = key.split(separator);
  for (let currObj: any = source, i = 0, len = keys.length; i < len; i++) {
    const key = keyFunc ? keyFunc(keys[i]) : keys[i],
      match = key.includes("[") && key.match(arrRegex);
    if (match) {
      const [, key, iStr] = match;
      if (!Array.isArray(currObj[key]) || !(key in currObj)) return false;
      if (i === len - 1) return true;
      currObj = currObj[key][Number(iStr)];
    } else {
      if (!isObj<Record<string, any>>(currObj) || !(key in currObj)) return false;
      if (i === len - 1) return true;
      currObj = currObj[key];
    }
  }
  return true;
}

/**
 * Converts flattened keys into nested object structure.
 * @example
 * const flat = { "user.name": "Kosi", "user.role": "admin" };
 * const obj = parseAnyObj(flat);
 */
export function parseAnyObj<T extends Record<string, any>, const S extends string = ".">(obj: T, separator: S = "." as S, keyFunc = (p: string) => p, seen = new WeakSet()): Unflatten<T, S> {
  if (!isObj(obj) || seen.has(obj)) return obj as Unflatten<T, S>; // no circular references
  seen.add(obj);
  const result: any = {},
    keys = Object.keys(obj);
  for (let i = 0, len = keys.length; i < len; i++) {
    const key: any = keys[i],
      val: any = obj[key];
    key === "*" || key.includes(separator) ? setAny(result, key, parseAnyObj(val, separator, keyFunc, seen), separator, keyFunc) : (result[key] = isObj(val) ? parseAnyObj(val, separator, keyFunc, seen) : val);
  }
  return result as Unflatten<T, S>;
}

/** Normalizes boolean/object event options into a single options object. */
export function parseEvtOpts<T extends object, const K extends (keyof T)[] | readonly (keyof T)[], const O extends K[number] = K[0]>(options: T | boolean | undefined, opts: K, boolOpt: O = opts[0] as O, result = {} as T): T & { [P in O]-?: T[P] } {
  return Object.assign(result, "boolean" === typeof options ? { [boolOpt]: options } : options), result as T & { [P in O]-?: T[P] };
}

// Merging & Traversal

export interface FanoutTuple extends Partial<Record<(typeof fanoutOptsArr)[number], any>> {
  /** Whether to merge values before fanout, useful for patching usecases. */
  merge?: boolean;
  /** How many levels to fan out, set based on your listener paths max dots. `true` is `Infinity`, defaults to `1` for event cascading otherwise `Infinity`. */
  depth?: number | boolean;
  /** Whether to assign arrays as a whole and only touch `.length` for common cases. Only works with the `path` parameter overload or in nested levels.
   * Arrays can lead to unnecessary work as more often than not, you won't be watching index paths but waiting on the parent bubble instead.
   * If you happen to be watching, it might be more optimal to re-set it yourself if it's only a few indexes or just turn set this to `false`. */
  atomic?: boolean;
}
/**
 * Unified expansion utility.
 * Bridges Coarse (Immutable replacement) writes into Fine-grained (Reactive) writes by surgically
 * expanding a single object write into multiple granular child operations for deep optimal xbubbling.
 * @example
 * // Event Mode (Cascading after-write)
 * rtr.on("user", (e) => fanout(e, { depth: 1 })); // defaults to 1 level deep for events
 * @example
 * // Direct Mode (Patching before-write)
 * fanout(state.user, { session: { id: 1, name: "Kosi", role: "admin" } }, { depth: Infinity }); // default to `Infinity` here
 */
export function fanout<T extends object>(event: ReactorEvent<T> | Payload<T>, options?: { crossRealms?: boolean } & FanoutTuple): void;
export function fanout<T extends object>(target: T, value: Partial<T>, options?: { crossRealms?: boolean } & FanoutTuple): void;
export function fanout<T extends object, P extends WildPaths<T> = WildPaths<T>>(state: T, path: P, value: Partial<PathValue<T, P>>, options?: { crossRealms?: boolean } & FanoutTuple): void;
export function fanout(a: any, b?: any, c?: any, d?: any): void {
  const isEvPd = !!a?.target,
    isPath = !isEvPd && "string" === typeof b,
    [state, path, olds, news, opts, type] = isEvPd ? [a.root, a.currentTarget.path, a.currentTarget.oldValue, a.currentTarget.value, b || NIL, a.type] : isPath ? [a, b, getAny(a, b), c, d || NIL, undefined] : [undefined, undefined, a, b, c || NIL, undefined],
    target = isEvPd ? getAny(a.root, a.currentTarget.path) : isPath ? getAny(state, path) : olds; // to avoid stale refs during write-walk
  if ((isEvPd && type !== "set" && type !== "delete") || !target || !canHandle(news, opts)) return;
  const prev = CTX.isCascading;
  CTX.isCascading = isEvPd; // if event or payload, already written values can bypass equality checks
  try {
    const walk = (target: any, obj: any, depth = isEvPd ? 1 : Infinity, keys = Object.keys(obj)) => {
      for (let i = 0, len = keys.length; i < len; i++) {
        const key = keys[i],
          val = obj[key];
        try {
          if ((opts.atomic ?? true) && Array.isArray(val)) (target[key] = val), (target[key].length = target[key].length); // ping commoners
          else depth > 1 && canHandle(val, opts) ? walk((target[key] ||= {}), val, depth - 1) : (target[key] = val);
        } catch (e) {
          if (e instanceof RangeError) throw e; // internals can skip, not users
        } // call a spade a spade and just skip, no descriptor gymanstics
      }
    };
    if ((opts.atomic ?? true) && Array.isArray(news) && isPath) setAny(state, path, news), (getAny(state, path).length = news.length); // ping commoners
    else walk(target, opts.merge ? mergeObjs(olds, news, opts) : news, opts.depth === true ? Infinity : opts.depth);
  } finally {
    CTX.isCascading = prev;
  }
}
export const fanoutOptsArr = ["merge", "depth", "atomic"] as const;

/**
 * Deep-merges object-like values, does necessary checks so use without doubts.
 * @example
 * const next = mergeObjs({ user: { name: "Kosi" } }, { user: { role: "admin" } }); // { ...o1, ...o2 } // o2 over o1 and deep!
 */
export function mergeObjs<T1 extends object, T2 extends object>(o1?: T1 | null, o2?: T2 | null, config?: { crossRealms?: boolean }, pojocheck?: boolean): DeepMerge<T1, T2>;
export function mergeObjs(o1?: any, o2?: any, config?: { crossRealms?: boolean }, pojocheck = true): any {
  if (pojocheck && (!isPOJO(o1 || NIL, config) || !isPOJO(o2 || NIL, config))) return o2;
  const merged = { ...(o1 ||= {}), ...(o2 ||= {}) },
    keys = Object.keys(merged);
  for (let i = 0, len = keys.length; i < len; i++) {
    const key = keys[i],
      o1C = o1[key],
      o2C = o2[key];
    if (isPOJO(o1C, config) && isPOJO(o2C, config)) merged[key] = mergeObjs(o1C, o2C, config, false); // fewer writes is less costly here
  }
  return merged;
}

/** Returns [path, parent, value] records from root to the target path. */
export function getTrailRecords<T extends object>(obj: T, path: WildPaths<T>, reverse = false): [WildPaths<T>, PathBranchValue<T, WildPaths<T>>, PathValue<T, WildPaths<T>>][] {
  const parts = path.split("."),
    chain: ReturnType<typeof getTrailRecords<T>> = [["*", obj, obj]];
  for (let acc = "", currObj: any = obj, i = 0, len = parts.length; i < len; i++) {
    const part = parts[i];
    chain.push([(acc += (i ? "." : "") + part) as WildPaths<T>, currObj, (currObj = currObj?.[part])]); // one iteration per depth, one-time storage over rcurrent derivation
  }
  return reverse ? chain.reverse() : chain;
}

// Cloning

/**
 * Deep-clones supported object structures.
 * @example
 * const cloned = deepClone({ user: { name: "Kosi" } });
 */
export function deepClone<T>(obj: T, config: { crossRealms?: boolean; preserveContext?: boolean } = NIL, seen = new WeakMap()): T {
  if (!obj || "object" !== typeof obj) return obj;
  const cloned = seen.get(obj);
  if (cloned) return cloned;
  if (!canHandle(obj, config, false)) return obj; // no circular references
  const clone: any = config.preserveContext ? Object.create(Object.getPrototypeOf(obj)) : Array.isArray(obj) ? [] : {};
  seen.set(obj, clone);
  const keys = config.preserveContext ? Reflect.ownKeys(obj) : Object.keys(obj);
  for (let i = 0, len = keys.length; i < len; i++) {
    const key = keys[i];
    try {
      clone[key] = deepClone((obj as any)[key], config, seen);
    } catch (e) {
      if (e instanceof RangeError) throw e; // internals can skip, not users
    } // call a spade a spade and just skip, no descriptor gymanstics
  }
  return clone;
} // POJO|Arr|Dynamic Deep cloner

// Destruction

/** Nulls all non-function instance properties across the prototype chain. */
export function nuke(target: any): void {
  let proto = target;
  while (proto && proto !== Object.prototype) {
    const keys = Object.getOwnPropertyNames(proto);
    for (let i = 0, len = keys.length; i < len; i++) {
      const key = keys[i];
      if (key === "constructor") continue;
      const desc = Object.getOwnPropertyDescriptor(proto, keys[i]);
      if (desc && ("function" === typeof desc.value || desc.get || desc.set)) continue;
      proto[key] = null; // See ya!, it's armageddon baby!
    }
    proto = Object.getPrototypeOf(proto);
  }
}
