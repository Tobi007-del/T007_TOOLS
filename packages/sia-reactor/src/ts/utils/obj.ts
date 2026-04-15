import { CTX, NIL } from "../core/consts";
import { ReactorEvent } from "../core/event";
import { Payload } from "../types/reactor";
import type { DeepMerge, Unflatten, WildPaths, PathValue, PathBranchValue } from "../types/obj";

const arrRx = /^([^\[\]]+)\[(\d+)\]$/;

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
  if (typecheck && !isObj(obj, false)) return false;
  if (Array.isArray(obj) || (!config.preserveContext && isPOJO(obj, config, false))) return true;
  if (config.preserveContext) return !(obj instanceof Map) && !(obj instanceof Set) && !(obj instanceof WeakMap) && !(obj instanceof WeakSet) && !(obj instanceof Error) && !(obj instanceof Number) && !(obj instanceof Date) && !(obj instanceof String) && !(obj instanceof RegExp) && !(obj instanceof ArrayBuffer) && !(obj instanceof Promise);
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
      match = key.includes("[") && key.match(arrRx);
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
      match = key.includes("[") && key.match(arrRx);
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
      match = key.includes("[") && key.match(arrRx);
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
      match = key.includes("[") && key.match(arrRx);
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
    const k: any = keys[i];
    k === "*" || k.includes(separator) ? setAny(result, k, parseAnyObj(obj[k] as any, separator, keyFunc, seen), separator, keyFunc) : (result[k] = isObj(obj[k]) ? parseAnyObj(obj[k] as any, separator, keyFunc, seen) : obj[k]);
  }
  return result as Unflatten<T, S>;
}

/** Normalizes boolean/object event options into a single options object. */
export function parseEvtOpts<T extends object>(options: T | boolean | undefined, opts: (keyof T)[] | readonly (keyof T)[], boolOpt: keyof T = opts[0], result = {} as T): T {
  return Object.assign(result, "boolean" === typeof options ? { [boolOpt]: options } : options), result;
}

// Merging & Traversal

/**
 * Unified expansion utility.
 * Bridges Coarse (Immutable replacement) writes into Fine-grained (Reactive) writes by
 * surgically expanding a single object write into multiple granular child operations.
 * @example
 * // Event Mode (Cascading after-write)
 * rtr.on("user", (e) => fanout(e, { depth: 1 })); // defaults to 1 level deep
 * @example
 * // Direct Mode (Patching before-write)
 * fanout(state, "user", { session: { id: 1, name: "Kosi", role: "admin" } }, { depth: Infinity }); // use this or `true` to fanout all nested keys
 */
export function fanout<T extends object>(event: ReactorEvent<T> | Payload<T>, options?: { merge?: boolean; depth?: number | boolean; crossRealms?: boolean }): void;
export function fanout<T extends object>(state: T, path: WildPaths<T>, value: any, options?: { merge?: boolean; depth?: number | boolean; crossRealms?: boolean }): void;
export function fanout(a: any, b?: any, c?: any, d?: any): void {
  const isEvtPld = !!a?.target,
    [state, path, news, olds, opts, type] = isEvtPld ? [a.root, a.currentTarget.path, a.currentTarget.value, a.currentTarget.oldValue, b || NIL, a.type] : [a, b, c, (d || NIL).merge ? getAny(a, b) : NIL, d || NIL],
    target = path === "*" ? state : getAny(state, path as any);
  if ((isEvtPld && type !== "set" && type !== "delete") || !target || !canHandle(news, opts)) return;
  const prev = CTX.isCascading;
  CTX.isCascading = isEvtPld; // if event or payload, already written values can bypass equality checks
  try {
    const walk = (target: any, obj: any, depth = 1, keys = Object.keys(obj)) => {
      for (let i = 0, len = keys.length; i < len; i++) {
        const val = obj[keys[i]];
        try {
          depth > 1 && canHandle(val, opts) ? walk((target[keys[i]] ||= {}), val, depth - 1) : (target[keys[i]] = val);
        } catch {} // call a spade a spade and just skip, no descriptor gymanstics
      }
    };
    walk(target, opts.merge && canHandle(olds, opts) ? mergeObjs(olds, news) : news, opts.depth === true ? Infinity : +opts.depth);
  } finally {
    CTX.isCascading = prev;
  }
}

/**
 * Deep-merges object-like values.
 * @example
 * const next = mergeObjs({ user: { name: "Kosi" } }, { user: { role: "admin" } });
 */
export function mergeObjs<T1 extends object, T2 extends object>(o1: T1, o2: T2): DeepMerge<T1, T2>;
export function mergeObjs<T1 extends object>(o1: T1): T1;
export function mergeObjs<T2 extends object>(o1: undefined | null, o2: T2): T2;
export function mergeObjs(o1: any = {}, o2: any = {}): any {
  const merged = { ...(o1 ||= {}), ...(o2 ||= {}) },
    keys = Object.keys(merged);
  for (let i = 0, len = keys.length; i < len; i++) {
    const k = keys[i];
    if (isObj(o1[k]) && isObj(o2[k])) merged[k] = mergeObjs(o1[k], o2[k]);
  }
  return merged;
}

/** Returns [path, parent, value] records from root to the target path. */
export function getTrailRecords<T extends object>(obj: T, path: WildPaths<T>, reverse = false): [WildPaths<T>, PathBranchValue<T, WildPaths<T>>, PathValue<T, WildPaths<T>>][] {
  const parts = path.split("."),
    chain: ReturnType<typeof getTrailRecords<T>> = [["*", obj, obj]];
  for (let acc = "", currObj: any = obj, i = 0, len = parts.length; i < len; i++) chain.push([(acc += (i ? "." : "") + parts[i]) as WildPaths<T>, currObj, (currObj = currObj?.[parts[i]])]); // one iteration per depth, one-time storage over rcurrent derivation
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
  for (let i = 0, len = keys.length; i < len; i++)
    try {
      clone[keys[i]] = deepClone((obj as any)[keys[i]], config, seen);
    } catch {} // call a spade a spade and just skip, no descriptor gymanstics
  return clone;
} // POJO|Arr|Dynamic Deep cloner

// Destruction

/** Nulls all non-function instance properties across the prototype chain. */
export function nuke(target: any): void {
  let proto = target;
  while (proto && proto !== Object.prototype) {
    const keys = Object.getOwnPropertyNames(proto);
    for (let i = 0, len = keys.length; i < len; i++) {
      if (keys[i] === "constructor") continue;
      const desc = Object.getOwnPropertyDescriptor(proto, keys[i]);
      if (desc && ("function" === typeof desc.value || desc.get || desc.set)) continue;
      proto[keys[i]] = null; // See ya!, it's armageddon baby!
    }
    proto = Object.getPrototypeOf(proto);
  }
}
