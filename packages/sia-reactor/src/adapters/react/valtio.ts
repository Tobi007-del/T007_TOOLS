import { useSyncExternalStore, useRef, useMemo, useCallback, useLayoutEffect, useEffect } from "react";
import { Reactor, Reactive, type WildPaths } from "../..";
import { isStrictObj, isDef } from "../../utils";
import { NIL, NOOP } from "../../core/reactor";

const useISOLayoutEffect = isDef(window) ? useLayoutEffect : useEffect; // SSR Safety for Next.js/Remix users

export function useReactor<T extends object>(target: T | Reactor<T> | Reactive<T>, prefs: { sync: boolean } = NIL): T {
  const rtrRef = useRef<Reactor<T>>(),
    rtr = (rtrRef.current ||= target instanceof Reactor ? target : (target as Reactive<T>).__Reactor__ || new Reactor(target, { lineageTracing: true, smartCloning: true })),
    cache = useRef(new WeakMap<object, any>()),
    paths = useRef(new Set<string>()),
    clups = useRef<Array<() => void>>([]), // Holds S.I.A cleanup functions
    notifyRef = useRef<() => void>(NOOP); // Holds React's trigger function

  const track = (path: string, ps = paths.current) => {
    for (const p of ps) {
      if (path === p || path.startsWith(p + ".")) return;
      if (p.startsWith(path + ".")) ps.delete(p);
    }
    ps.add(path);
  };
  const subscribe = useCallback((notify: () => void) => {
    notifyRef.current = notify;
    return () => {
      for (let i = 0, len = clups.current.length; i < len; i++) clups.current[i]();
      clups.current.length = 0;
    };
  }, []);
  const snap = useSyncExternalStore(subscribe, rtr.snapshot, rtr.snapshot);

  useISOLayoutEffect(() => {
    for (let i = 0, len = clups.current.length; i < len; i++) clups.current[i]();
    clups.current.length = 0;
    if (!paths.current.size || paths.current.has("")) clups.current.push(rtr[prefs.sync ? "watch" : "on"]("*", notifyRef.current));
    else for (const p of paths.current) clups.current.push(rtr[prefs.sync ? "watch" : "on"](p as WildPaths<T>, notifyRef.current));
  });

  return useMemo(() => {
    paths.current.clear();
    const wrap = <O extends object>(obj: O, path = ""): O => {
      if (!(isStrictObj(obj, rtr.config.crossRealms) || Array.isArray(obj))) return obj;
      if (cache.current.has(obj)) return cache.current.get(obj);
      const proxy = new Proxy(obj, {
        get: (object, key) => {
          if ("symbol" === typeof key) return (object as any)[key];
          const fullPath = path ? `${path}.${String(key)}` : String(key);
          return track(fullPath), wrap((object as any)[key], fullPath);
        },
      });
      return cache.current.set(obj, proxy), proxy;
    };
    return wrap(snap);
  }, [snap]);
}
