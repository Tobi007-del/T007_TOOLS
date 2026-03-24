import type { DeepMerge, Unflatten, WildPaths, Paths, PathValue } from "../types/obj";
const arrRx = /^([^\[\]]+)\[(\d+)\]$/;

// Type Guards
export function isDef(val: any): boolean {
  return val !== undefined;
}

export function isArr<T = unknown>(obj: any): obj is T[] {
  return Array.isArray(obj);
}

export function isObj<T extends object = object>(obj: any, checkArr = true): obj is T {
  return "object" === typeof obj && obj !== null && (checkArr ? !Array.isArray(obj) : true);
} // okay for common use cases but loose
export function isStrictObj<T extends object = object>(obj: any, crossRealms = false, typecheck = true): obj is T {
  return (typecheck ? isObj(obj, false) : true) && (crossRealms ? Object.prototype.toString.call(obj) === "[object Object]" : obj.constructor === Object);
} // for strict own POJOs, handles cross-realm objects too

export function isIter<T = unknown>(obj: any): obj is Iterable<T> {
  return obj != null && "function" === typeof obj[Symbol.iterator];
}

export function inBoolArrOpt(opt: any, str: string): boolean {
  return opt?.includes?.(str) ?? opt;
}

export function setAny<T extends object, const S extends string = ".">(target: T, key: Paths<T, S>, value: PathValue<T, typeof key, S>, separator: S = "." as S, keyFunc?: (p: string) => string): void {
  if (!key.includes(separator)) return void ((target as any)[keyFunc ? keyFunc(key) : key] = value);
  const keys = key.split(separator);
  for (let currObj: any = target, i = 0, len = keys.length; i < len; i++) {
    const key = keyFunc ? keyFunc(keys[i]) : keys[i],
      match = key.includes("[") && key.match(arrRx);
    if (match) {
      const [, key, iStr] = match;
      if (!isArr(currObj[key])) currObj[key] = [];
      if (i === len - 1) currObj[key][Number(iStr)] = value;
      else ((currObj[key][Number(iStr)] ||= {}), (currObj = currObj[key][Number(iStr)]));
    } else {
      if (i === len - 1) currObj[key] = value;
      else ((currObj[key] ||= {}), (currObj = currObj[key]));
    }
  }
}

export function getAny<T extends object, const S extends string = ".">(source: T, key: Paths<T, S>, separator: S = "." as S, keyFunc?: (p: string) => string): PathValue<T, typeof key, S> | undefined {
  if (!key.includes(separator)) return (source as any)[keyFunc ? keyFunc(key) : key];
  const keys = key.split(separator);
  let currObj: any = source;
  for (let i = 0, len = keys.length; i < len; i++) {
    const key = keyFunc ? keyFunc(keys[i]) : keys[i],
      match = key.includes("[") && key.match(arrRx);
    if (match) {
      const [, key, iStr] = match;
      if (!isArr(currObj[key]) || !(key in currObj)) return undefined;
      currObj = currObj[key][Number(iStr)];
    } else {
      if (!isObj<Record<string, any>>(currObj) || !(key in currObj)) return undefined;
      currObj = currObj[key];
    }
  }
  return currObj;
}

export function deleteAny<T extends object, const S extends string = ".">(target: T, key: Paths<T, S>, separator: S = "." as S, keyFunc?: (p: string) => string): void {
  if (!key.includes(separator)) return void delete (target as any)[keyFunc ? keyFunc(key) : key];
  const keys = key.split(separator);
  for (let currObj: any = target, i = 0, len = keys.length; i < len; i++) {
    const key = keyFunc ? keyFunc(keys[i]) : keys[i],
      match = key.includes("[") && key.match(arrRx);
    if (match) {
      const [, key, iStr] = match;
      if (!isArr(currObj[key]) || !(key in currObj)) return;
      if (i === len - 1) delete currObj[key][Number(iStr)];
      else currObj = currObj[key][Number(iStr)];
    } else {
      if (!isObj<Record<string, any>>(currObj) || !(key in currObj)) return;
      if (i === len - 1) delete currObj[key];
      else currObj = currObj[key];
    }
  }
}

export function inAny<T extends object, const S extends string = ".">(source: T, key: string | Paths<T, S>, separator: S = "." as S, keyFunc?: (p: string) => string): boolean {
  if (!key.includes(separator)) return key in source;
  const keys = key.split(separator);
  for (let currObj: any = source, i = 0, len = keys.length; i < len; i++) {
    const key = keyFunc ? keyFunc(keys[i]) : keys[i],
      match = key.includes("[") && key.match(arrRx);
    if (match) {
      const [, key, iStr] = match;
      if (!isArr(currObj[key]) || !(key in currObj)) return false;
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

export function parseAnyObj<T extends Record<string, any>, const S extends string = ".">(obj: T, separator: S = "." as S, keyFunc = (p: string) => p, visited = new WeakSet()): Unflatten<T, S> {
  if (!isObj(obj) || visited.has(obj)) return obj as Unflatten<T, S>; // no circular references
  visited.add(obj);
  const result: any = {};
  Object.keys(obj).forEach((k) => (k.includes(separator) ? setAny(result, k as any, parseAnyObj(obj[k] as any, separator, keyFunc, visited), separator, keyFunc) : (result[k] = isObj(obj[k]) ? parseAnyObj(obj[k] as any, separator, keyFunc, visited) : obj[k])));
  return result as Unflatten<T, S>;
}

export function parseEvOpts<T extends object>(options: T | boolean | undefined, opts: (keyof T)[] | readonly (keyof T)[], boolOpt: keyof T = opts[0], result = {} as T): T {
  return (Object.assign(result, "boolean" === typeof options ? { [boolOpt]: options } : options), result);
}

// Merging & Traversal
export function mergeObjs<T1 extends object, T2 extends object>(o1: T1, o2: T2): DeepMerge<T1, T2>;
export function mergeObjs<T1 extends object>(o1: T1): T1;
export function mergeObjs<T2 extends object>(o1: undefined | null, o2: T2): T2;
export function mergeObjs(o1: any = {}, o2: any = {}): any {
  const merged = { ...(o1 || {}), ...(o2 || {}) };
  return (Object.keys(merged).forEach((k) => isObj(o1?.[k]) && isObj(o2?.[k]) && (merged[k] = mergeObjs(o1[k], o2[k]))), merged);
}

export function getTrailPaths<T>(path: WildPaths<T>, reverse: boolean = true): WildPaths<T>[] {
  const parts = path.split("."),
    chain: WildPaths<T>[] = ["*"];
  let acc = "";
  for (let i = 0, len = parts.length; i < len; i++) chain.push((acc += (i === 0 ? "" : ".") + parts[i]) as WildPaths<T>);
  return reverse ? chain.reverse() : chain; // for mostly logs
}

export function getTrailRecords<T extends object>(obj: T, path: WildPaths<T>): [WildPaths<T>, PathValue<T, WildPaths<T>>, PathValue<T, WildPaths<T>>][] {
  const parts = path.split("."),
    record: ReturnType<typeof getTrailRecords<T>> = [["*", obj, obj]];
  let acc = "",
    currObj: any = obj;
  for (let i = 0, len = parts.length; i < len; i++) record.push([(acc += (i ? "." : "") + parts[i]) as WildPaths<T>, currObj, (currObj = currObj?.[parts[i]])]); // at most one iteration per depth, storage over derivation
  return record;
}

// Cloning
export function deepClone<T>(obj: T, crossRealms?: boolean, visited = new WeakMap()): T {
  if (!(isStrictObj(obj, crossRealms) || isArr(obj)) || visited.has(obj)) return obj; // no circular references
  const clone: any = isArr(obj) ? [] : {};
  visited.set(obj, clone);
  const keys = Object.keys(obj);
  for (let i = 0, len = keys.length; i < len; i++) clone[keys[i]] = deepClone((obj as any)[keys[i]], crossRealms, visited);
  return clone;
} // POJO|Arr Deep cloner

// Destruction
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
