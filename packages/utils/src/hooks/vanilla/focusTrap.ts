import { createEl, getActiveElement as active, INTERACTIVE_SELECTOR } from "../../core/dom";
import { NIL } from "sia-reactor";

export interface FocusTrapConfig {
  /** Enables or disables the focus trap. Defaults to `false`. */
  enabled?: boolean;
  /** The preferred initial focus target selector within the element. Defaults to `[data-autofocus]`. */
  initialSelector?: string;
  /** The class name for the initial focus ring since programmatic focus is not always visible. Defaults to `"focus-outline"`. */
  ringClassName?: string;
  /** Optional root used to scope focus listeners to an element instead of the window. Defaults to `window`. */
  root?: HTMLElement | Document | Window;
  /** Whether the focus trap is scoped to the root provided it is an HTMLElement. Defaults to `true`. */
  scoped?: boolean;
  /** Passed down to all event listeners used. Defaults to `true`. */
  capture?: boolean;
}

const stacks = new WeakMap<EventTarget, HTMLElement[]>();

/** Hook to keep focus trapped inside an element until disabled. */
export function initFocusTrap(el: HTMLElement, { enabled = false, initialSelector = "[data-autofocus]", ringClassName = "focus-outline", root = window, scoped = true, capture = true }: FocusTrapConfig = NIL): (() => void) | void {
  const existing = (t007._ftrappers ??= new WeakMap<HTMLElement, () => void>()).get(el);
  if (!enabled || existing) return existing ? existing : undefined;
  (scoped = scoped && root instanceof HTMLElement), (root = scoped ? root : root === document ? document : window); // reassigning for predictability
  const stack = stacks.get(root) ?? [],
    focused = document.querySelector<HTMLElement>(":focus"),
    initial = el.querySelector<HTMLElement>(initialSelector),
    first = createEl("span", { tabIndex: 0 }, { focusGuard: "start" }, { position: "absolute", width: "0", height: "0", pointerEvents: "none" }),
    last = createEl("span", { tabIndex: 0 }, { focusGuard: "end" }, { position: "absolute", width: "0", height: "0", pointerEvents: "none" }),
    getFocusable = (c = el) => Array.prototype.filter.call(c.querySelectorAll<HTMLElement>(INTERACTIVE_SELECTOR), (el) => !el.hasAttribute("disabled") && !el.hasAttribute("aria-hidden") && !el.hasAttribute("data-focus-guard")),
    resetFocus = (i = 0, els: any[] | null = getFocusable()) => (els?.length ? els.at(i).focus() : (!el.hasAttribute("tabindex") && (el.tabIndex = -1), el.focus())),
    edgeFocus = (pre = false) => {
      if (!scoped) return resetFocus(pre ? -1 : 0);
      else if ((root as HTMLElement).hasAttribute("tabindex")) return (root as HTMLElement).focus(); // If root is programmatically focusable, fallback and restore natural order.
      const items = getFocusable();
      if (!items.length) return resetFocus(0, null); // el can catch focus if it's empty
      const all = getFocusable((root as HTMLElement).parentElement?.closest(`:has(${INTERACTIVE_SELECTOR})`) || document.body);
      for (let target, len = all.length, i = all.indexOf(items[pre ? 0 : items.length - 1]) + (pre ? -1 : 1); pre ? i >= 0 : i < len; pre ? i-- : i++) if (!(root as HTMLElement).contains((target = all[i]))) return target.focus();
      (pre ? first : last).blur(); // If no focusable items, blur the guard to block visible focus.
    },
    handleFocusIn = () => stack.at(-1) === el && active() !== root && !el.contains(active()) && setTimeout(resetFocus, 0, 0),
    handleInitialBlur = () => initial!.classList.remove(ringClassName);

  first.addEventListener("focus", (e) => (el.contains(e.relatedTarget as Node) ? edgeFocus(true) : resetFocus()), capture), el.prepend(first);
  last.addEventListener("focus", (e) => (el.contains(e.relatedTarget as Node) ? edgeFocus() : resetFocus(-1)), capture), el.append(last);
  root.addEventListener("focusin", handleFocusIn, capture);
  if (!el.querySelector(":focus")) !initial ? resetFocus() : setTimeout(() => (initial.classList.add(ringClassName), initial.focus(), initial.addEventListener("blur", handleInitialBlur, capture)));
  if (!stack.includes(el)) stack.push(el), stacks.set(root, stack);

  const destroy = () => {
    focused?.isConnected && focused.focus(), first.remove(), last.remove();
    root.removeEventListener("focusin", handleFocusIn, capture);
    initial?.removeEventListener("blur", handleInitialBlur, capture);
    t007._ftrappers!.delete(el), stack.splice(stack.indexOf(el), 1);
  };
  return t007._ftrappers.set(el, destroy), destroy;
}

/** Remove the focus trap guard from an element. */
export const removeFocusTrap = (el: HTMLElement) => t007._ftrappers?.get(el)?.();
