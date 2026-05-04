import { useEffect, type RefObject } from "react";
import { FocusTrapConfig, initFocusTrap } from "../vanilla/focusTrap";
import { NIL } from "sia-reactor";

/** React hook  to keep focus trapped inside an element until disabled. */
export function useFocusTrap(ref: RefObject<HTMLElement>, config: FocusTrapConfig = NIL) {
  useEffect(() => (ref.current ? initFocusTrap(ref.current, config) : undefined), [ref, config.enabled, config.initialSelector, config.ringClassName, config.root, config.scoped, config.capture]);
}
