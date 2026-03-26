import { useSyncExternalStore, useRef, useMemo, useCallback } from "react";
import { Reactor, Reactive, type WildPaths } from "../..";
import { isStrictObj, isArr } from "../../utils";

// Nothing much here, just rebuilding "Valtio.js" `useSnapshot`, Proof of Concept: Reactor is a core of cores
export function useReactor<T extends object>(target: T | Reactor<T> | Reactive<T>): T {
  const rtrRef = useRef<Reactor<T>>(),
    rtr = (rtrRef.current ||= target instanceof Reactor ? target : (target as Reactive<T>).__Reactor__ || new Reactor(target, { lineageTracing: true, smartCloning: true })), // structural sharing
    cache = useRef(new WeakMap<object, any>()),
    paths = useRef(new Set<string>());

  const track = (path: string, ps = paths.current) => {
    for (const p of ps) {
      if (path === p || path.startsWith(p + ".")) return;
      if (p.startsWith(path + ".")) ps.delete(p);
    }
    ps.add(path);
  };

  const sub = useCallback(
    (notify: () => void) => {
      if (!paths.current.size || paths.current.has("")) return rtr.on("*", notify);
      const clups = Array.from(paths.current).map((path) => rtr.on(path as WildPaths<T>, notify));
      return () => {
        for (let i = 0, len = clups.length; i < len; i++) clups[i]();
      };
    },
    [rtr]
  );

  const snap = useSyncExternalStore(
    sub,
    () => rtr.snapshot(),
    () => rtr.snapshot()
  );

  return useMemo(() => {
    paths.current.clear();
    const wrap = <O extends object>(obj: O, path = ""): O => {
      if (!(isStrictObj(obj, rtr.config.crossRealms) || isArr(obj))) return obj;
      if (cache.current.has(obj)) return cache.current.get(obj);
      const proxy = new Proxy(obj, {
        get: (object, key) => {
          if ("symbol" === typeof key) return (object as any)[key];
          const fullPath = path ? `${path}.${key}` : key;
          return track(fullPath), wrap((object as any)[key], fullPath);
        },
      });
      return cache.current.set(obj, proxy), proxy;
    };
    return wrap(snap);
  }, [snap]);
}
