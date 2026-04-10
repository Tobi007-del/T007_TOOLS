import { useLayoutEffect, useEffect } from "react";

/** Isomorphic layout effect alias (`useLayoutEffect` in browser, `useEffect` otherwise). */
export const useISOLayoutEffect = "undefined" !== typeof window ? useLayoutEffect : useEffect;
