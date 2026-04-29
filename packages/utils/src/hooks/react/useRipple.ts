import { useCallback } from "react";
import { RippleConfig, rippleHandler } from "../vanilla/ripple";
import { NIL } from "sia-reactor";

/** React hook to render and control a material-style ripple animation on an element.
 * @returns Stable pointer handler for clickable UI surfaces.
 */
export function useRipple() {
  return useCallback((e: React.PointerEvent<HTMLElement>, config: RippleConfig = NIL) => rippleHandler(e.nativeEvent, config), []);
}
