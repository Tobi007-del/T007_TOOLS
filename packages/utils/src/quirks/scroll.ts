import { createEl } from "..";

// ============ Vertical Scrollerator ============
interface ScrolleratorOptions {
  baseSpeed?: number;
  maxSpeed?: number;
  stepDelay?: number;
  baseRate?: number;
  lineHeight?: number;
  margin?: number;
  car?: Window | HTMLElement;
}

interface Scrollerator {
  drive: (clientY: number, brake?: boolean, offsetY?: number) => number;
  reset: () => void;
}

export function initVScrollerator({ baseSpeed = 3, maxSpeed = 10, stepDelay = 2000, baseRate = 16, lineHeight = 80, margin = 80, car = window }: ScrolleratorOptions = {}): Scrollerator {
  let linesPerSec = baseSpeed,
    accelId: ReturnType<typeof setTimeout> | null = null,
    lastTime: number | null = null;
  const drive = (clientY: number, brake = false, offsetY = 0): number => {
    if (car !== window) clientY -= offsetY;
    const now = performance.now(),
      speed = linesPerSec * lineHeight * ((lastTime ? now - lastTime : baseRate) / 1000);
    if (!brake && (clientY < margin || clientY > ((car as any).innerHeight ?? (car as any).offsetHeight) - margin)) {
      accelId === null ? (accelId = setTimeout(() => (linesPerSec += 1), stepDelay)) : linesPerSec > baseSpeed && (linesPerSec = Math.min(linesPerSec + 1, maxSpeed));
      (car as any).scrollBy?.(0, clientY < margin ? -speed : speed);
    } else reset();
    return ((lastTime = !brake ? now : null), speed);
  };
  const reset = () => (accelId && clearTimeout(accelId), (accelId = null), (linesPerSec = baseSpeed), (lastTime = null));
  return { drive, reset };
}

// ============ Scroll Assist ============
export interface ScrollAssistControl {
  update: () => void;
  destroy: () => void;
}

interface ScrollAssistOptions {
  pxPerSecond?: number;
  assistClassName?: string;
  vertical?: boolean;
  horizontal?: boolean;
}

export function initScrollAssist(el: HTMLElement, { pxPerSecond = 80, assistClassName = "tmg-video-controls-scroll-assist", vertical = true, horizontal = true }: ScrollAssistOptions = {}): ScrollAssistControl | void {
  t007._scrollers ??= new WeakMap<HTMLElement, ScrollAssistControl>();
  t007._scroller_r_observer ??= new ResizeObserver((entries) => entries.forEach(({ target }) => t007._scrollers!.get(target as HTMLElement)?.update()));
  t007._scroller_m_observer ??= new MutationObserver((entries) => {
    const els = new Set<HTMLElement>();
    for (const entry of entries) {
      let node: Element | null = entry.target instanceof Element ? entry.target : null;
      while (node && !t007._scrollers!.has(node as HTMLElement)) node = node.parentElement;
      if (node) els.add(node as HTMLElement);
    }
    for (const el of els) t007._scrollers!.get(el)?.update();
  });
  const parent = el?.parentElement;
  if (!parent || t007._scrollers!.has(el)) return;
  const assist: Record<string, HTMLElement> = {};
  let scrollId: number | null = null,
    last = performance.now(),
    assistWidth = 20,
    assistHeight = 20;
  const update = () => {
    const hasInteractive = !!parent.querySelector('button, a[href], input, select, textarea, [contenteditable="true"], [tabindex]:not([tabindex="-1"])');
    if (horizontal) {
      const w = assist.left?.offsetWidth || assistWidth,
        check = hasInteractive ? el.clientWidth < w * 2 : false;
      assist.left.style.display = check ? "none" : el.scrollLeft > 0 ? "block" : "none";
      assist.right.style.display = check ? "none" : el.scrollLeft + el.clientWidth < el.scrollWidth - 1 ? "block" : "none";
      assistWidth = w;
    }
    if (vertical) {
      const h = assist.up?.offsetHeight || assistHeight,
        check = hasInteractive ? el.clientHeight < h * 2 : false;
      assist.up.style.display = check ? "none" : el.scrollTop > 0 ? "block" : "none";
      assist.down.style.display = check ? "none" : el.scrollTop + el.clientHeight < el.scrollHeight - 1 ? "block" : "none";
      assistHeight = h;
    }
  };
  const scroll = (dir: string) => {
    const frame = () => {
      const now = performance.now(),
        dt = now - last;
      last = now;
      const d = (pxPerSecond * dt) / 1000;
      if (dir === "left") el.scrollLeft = Math.max(0, el.scrollLeft - d);
      if (dir === "right") el.scrollLeft = Math.min(el.scrollWidth - el.clientWidth, el.scrollLeft + d);
      if (dir === "up") el.scrollTop = Math.max(0, el.scrollTop - d);
      if (dir === "down") el.scrollTop = Math.min(el.scrollHeight - el.clientHeight, el.scrollTop + d);
      scrollId = requestAnimationFrame(frame);
    };
    last = performance.now();
    frame();
  };
  const stop = () => (cancelAnimationFrame(scrollId ?? 0), (scrollId = null));
  const addAssist = (dir: string): void => {
    const div = createEl("div", { className: assistClassName }, { scrollDirection: dir }, { display: "none" });
    if (!div) return;
    ["pointerenter", "dragenter"].forEach((evt) => div.addEventListener(evt, () => scroll(dir)));
    ["pointerleave", "pointerup", "pointercancel", "dragleave", "dragend"].forEach((evt) => div.addEventListener(evt, stop));
    dir === "left" || dir === "up" ? parent.insertBefore(div, el) : parent.append(div);
    assist[dir] = div;
  };
  if (horizontal) ["left", "right"].forEach(addAssist);
  if (vertical) ["up", "down"].forEach(addAssist);
  el.addEventListener("scroll", update);
  t007._scroller_r_observer!.observe(el);
  t007._scroller_m_observer!.observe(el, { childList: true, subtree: true, characterData: true });
  t007._scrollers.set(el, {
    update,
    destroy() {
      stop();
      el.removeEventListener("scroll", update);
      t007._scroller_r_observer!.unobserve(el);
      t007._scrollers!.delete(el);
      Object.values(assist).forEach((a) => a.remove());
    },
  });
  return (update(), t007._scrollers!.get(el));
}

export const removeScrollAssist = (el: HTMLElement) => t007._scrollers!.get(el)?.destroy();
