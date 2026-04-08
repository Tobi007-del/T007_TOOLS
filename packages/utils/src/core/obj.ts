// Type Guards
export function isDef(val: any): boolean {
  return "undefined" !== typeof val;
}

export function isSym<T extends symbol = symbol>(val: any): val is T {
  return "symbol" === typeof val;
}

export function isBool<T extends boolean = boolean>(val: any): val is T {
  return "boolean" === typeof val;
}

export function isNum<T extends number = number>(val: any): val is T {
  return "number" === typeof val;
}

export function isStr<T extends string = string>(val: any): val is T {
  return "string" === typeof val;
}

export function isArr<T = unknown>(obj: any): obj is T[] {
  return Array.isArray(obj);
}

export { isObj } from "sia-reactor/utils";
export function isPOJO<T extends object = object>(obj: any, crossRealms = false, typecheck = true): obj is T {
  return (typecheck ? isObj(obj, false) : true) && (crossRealms ? Object.prototype.toString.call(obj) === "[object Object]" : obj.constructor === Object);
} // for strict own POJOs, handles cross-realm objects too

export function isIter<T = unknown>(obj: any): obj is Iterable<T> {
  return obj != null && "function" === typeof obj[Symbol.iterator];
}

export function isFunc<T extends Function = Function>(val: any): val is T {
  return "function" === typeof val;
}

export function inBoolArrOpt(opt: any, str: string): boolean {
  return opt?.includes?.(str) ?? opt;
}
