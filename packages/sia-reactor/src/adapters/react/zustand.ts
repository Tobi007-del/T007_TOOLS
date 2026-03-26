import { useSyncExternalStore, useRef, useCallback } from "react";
import { Reactor, type Reactive } from "../..";

// Nothing much here, just rebuilding "Zustand.js" `useSelector`, Proof of Concept: Reactor is a core of cores
export function useSelector<T extends object, R>(target: T | Reactor<T> | Reactive<T>, sel: (state: T) => R, eq: (a: any, b: any) => boolean = Object.is): R {
  const rtrRef = useRef<Reactor<T>>(),
    rtr = (rtrRef.current ||= target instanceof Reactor ? target : (target as Reactive<T>).__Reactor__ || new Reactor(target, { lineageTracing: true, smartCloning: true })), // structural sharing
    selRef = useRef(sel),
    eqRef = useRef(eq),
    valRef = useRef<R>();
  (selRef.current = sel), (eqRef.current = eq); // Always bind the latest inline functions to bypass React closure traps

  const sub = useCallback((notify: () => void) => rtr.on("*", notify), [rtr]),
    getSnap = useCallback(() => {
      const next = selRef.current(rtr.snapshot());
      // S.I.A Terse Execution: If equal, return cached value. If not, assign and return the new value.
      return eqRef.current(valRef.current, next) ? (valRef.current as R) : (valRef.current = next);
    }, [rtr]);

  return useSyncExternalStore(sub, getSnap, getSnap);
}
