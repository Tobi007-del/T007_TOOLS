// "THE METHODIST": A mixin method expert often used to manipulate or bind all methods of a class to an instance

/**
 * Walks an instance and its prototype chain, invoking a callback for each callable method.
 * @param owner Instance whose methods are inspected.
 * @param callback Invoked for each method name found.
 * @param skipOwn Skips owner-level methods when traversing own or parent prototypes.
 * @param nested Internal traversal flag, Override to `true` to avoid skipping own methods when `skipOwn` is `true`.
 */
export function onAllMethods(owner: any, callback: (method: string, owner: any) => void, skipOwn = true, nested = false): void {
  let proto = owner;
  while (proto && proto !== Object.prototype) {
    for (const method of Object.getOwnPropertyNames(proto)) {
      if (method === "constructor") continue;
      if (nested && skipOwn && Object.prototype.hasOwnProperty.call(owner, method)) continue;
      if ("function" === typeof Object.getOwnPropertyDescriptor(proto, method)?.value) callback(method, owner);
    }
    (proto = Object.getPrototypeOf(proto)), (nested = true);
  }
}

/**
 * Binds all discovered methods on an owner to the owner instance.
 * @param owner Instance whose methods should be bound.
 */
export function bindAllMethods(owner: any): void {
  onAllMethods(owner, (method: string, owner: any) => {
    owner[method] = owner[method].bind(owner);
  });
}

/**
 * Wraps all discovered methods in a guard function, optionally binding before wrapping.
 * @param owner Instance whose methods should be wrapped.
 * @param guardFn Wrapper factory used for each method.
 * @param bound Binds methods to owner before wrapping when true.
 */
export function guardAllMethods(owner: any, guardFn: (fn: Function) => Function = guardMethod, bound = true): void {
  onAllMethods(owner, (method: string, owner: any) => {
    owner[method] = guardFn(bound ? owner[method].bind(owner) : owner[method]);
  });
}

/**
 * Wraps a function with try/catch and async rejection handling.
 * @template T Function type to preserve.
 * @param fn Function to wrap.
 * @param onError Error handler for sync throws and async rejections.
 * @returns Guarded function with the same call signature.
 */
export function guardMethod<T extends Function>(fn: T, onError: (e: any) => void = (e) => console.error(e)): T {
  return ((...args: any[]) => {
    try {
      const result = fn(...args);
      return result instanceof Promise ? result.catch((e) => onError(e)) : result;
    } catch (e) {
      onError(e);
    }
  }) as unknown as T;
}
